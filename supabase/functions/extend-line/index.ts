import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const API_BASE = "https://tv.extremeiptv.net:8443";
const API_KEY = "LcWopthRUnO4KPbZd89BE9PONzEWRR4C0hsbP4WwyML3Shmj62SFQXW9ZQL2H2NODtYnIiUHTntu9EXf2Clq06cbeMcTmuVO321Q";
const API_AUTH_USER = Deno.env.get("EXTREMEIPTV_AUTH_USER")!;

const PACKAGE_MAP: Record<string, number> = {
  "std-monthly": 101,           // 1 Month
  "std-premium-monthly": 101,   // 1 Month
  "std-3month": 102,            // 3 Months
  "std-premium-3month": 102,    // 3 Months
  "std-6month": 103,            // 6 Months
  "std-premium-6month": 103,    // 6 Months
  "std-yearly": 104,            // 12 Months
  "std-premium-yearly": 104,    // 12 Months
};

// Plans that include 2 TVs + 2 Phones
const PREMIUM_PLANS = new Set([
  "std-premium-monthly",
  "std-premium-3month",
  "std-premium-6month",
  "std-premium-yearly",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userEmail, planId } = await req.json();

    if (!userEmail || !planId) {
      return new Response(
        JSON.stringify({ error: "userEmail and planId are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const packageId = PACKAGE_MAP[planId];
    if (!packageId) {
      return new Response(
        JSON.stringify({ error: `Unknown plan ID: ${planId}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Look up user by email
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, line_id, line_username, line_password, expiration_date")
      .eq("username", userEmail)
      .maybeSingle();

    if (userError || !user) {
      console.error("User lookup error:", userError);
      return new Response(
        JSON.stringify({ error: "User not found", details: userError }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!user.line_id) {
      // No existing line — create a new one with the purchased package
      console.log(`User ${userEmail} has no line ID, creating new line`);

      const lineUsername = `user_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
      const linePassword = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

      const createResponse = await fetch(`${API_BASE}/ext/line/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": API_KEY,
          "X-Auth-User": API_AUTH_USER,
        },
        body: JSON.stringify({
          username: lineUsername,
          password: linePassword,
          package: packageId,
        }),
      });

      const createData = await createResponse.json();
      console.log("extremeiptv create-line response:", createData);

      if (!createResponse.ok || createData.error) {
        console.error("extremeiptv create-line error:", createData);
        return new Response(
          JSON.stringify({ error: "Failed to create line", details: createData }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const newLineId = createData.line_id;

      const updateFields: Record<string, unknown> = {
        line_username: lineUsername,
        line_password: linePassword,
        line_id: newLineId,
        expiration_date: createData.expire_at,
        max_devices: PREMIUM_PLANS.has(planId) ? 2 : 1,
      };

      const { error: createUpdateError } = await supabase
        .from("users")
        .update(updateFields)
        .eq("id", user.id);

      if (createUpdateError) {
        console.error("Error saving new line:", createUpdateError);
        return new Response(
          JSON.stringify({ error: "Line created but failed to save credentials", details: createUpdateError }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          created: true,
          line_username: lineUsername,
          line_password: linePassword,
          expiration_date: createData.expire_at,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Existing line — renew it
    const renewResponse = await fetch(`${API_BASE}/ext/line/${user.line_id}/renew`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": API_KEY,
        "X-Auth-User": API_AUTH_USER,
      },
      body: JSON.stringify({
        package: packageId,
      }),
    });

    const renewData = await renewResponse.json();
    console.log("extremeiptv renew response:", renewData);

    if (!renewResponse.ok || renewData.error) {
      console.error("extremeiptv renew error:", renewData);
      return new Response(
        JSON.stringify({ error: "Failed to renew line", details: renewData }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update expiration_date in users table using the API's returned expire_at
    const updateFields: Record<string, unknown> = { expiration_date: renewData.expire_at };
    if (PREMIUM_PLANS.has(planId)) updateFields.max_devices = 2;
    else updateFields.max_devices = 1;

    const { error: updateError } = await supabase
      .from("users")
      .update(updateFields)
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating expiration date:", updateError);
      return new Response(
        JSON.stringify({
          error: "Line extended but failed to update expiration date",
          details: updateError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `Line extended for user ${userEmail}: plan=${planId}, new expiry=${newExpiry.toISOString()}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        newExpirationDate: renewData.expire_at,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
