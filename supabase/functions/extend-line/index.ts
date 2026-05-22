import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const API_BASE = "https://distributors.argontv.nl";
const API_KEY = "d65811e842c29e7202851ef162e212a2";

const PACKAGE_MAP: Record<string, number> = {
  "std-monthly": 113653,           // 1 Month
  "std-premium-monthly": 113653,   // 1 Month
  "std-3month": 113654,            // 3 Months
  "std-premium-3month": 113654,    // 3 Months
  "std-6month": 113655,            // 6 Months
  "std-premium-6month": 113655,    // 6 Months
  "std-yearly": 113656,            // 12 Months
  "std-premium-yearly": 113656,    // 12 Months
};

// Duration in days per package for calculating new expiry (extend API doesn't return it)
const PACKAGE_DAYS: Record<number, number> = {
  113653: 30,
  113654: 90,
  113655: 180,
  113656: 365,
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

      const createResponse = await fetch(`${API_BASE}/api/v1/create-line`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ApiKey": API_KEY,
        },
        body: JSON.stringify({
          package: packageId,
          template: 1996,
        }),
      });

      const createData = await createResponse.json();
      console.log("argontv create-line response:", createData);

      if (!createResponse.ok || createData.error) {
        console.error("argontv create-line error:", createData);
        return new Response(
          JSON.stringify({ error: "Failed to create line", details: createData }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const newLineId = String(createData.id);
      const newLineUsername = createData.username as string;
      const newLinePassword = createData.password as string;
      const newExpirationDate = createData.expiration_time
        ? new Date((createData.expiration_time as number) * 1000).toISOString()
        : null;

      const updateFields: Record<string, unknown> = {
        line_username: newLineUsername,
        line_password: newLinePassword,
        line_id: newLineId,
        expiration_date: newExpirationDate,
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
          line_username: newLineUsername,
          line_password: newLinePassword,
          expiration_date: newExpirationDate,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Existing line — extend it
    const extendResponse = await fetch(`${API_BASE}/api/v1/extend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ApiKey": API_KEY,
      },
      body: JSON.stringify({
        lines: [Number(user.line_id)],
        package: packageId,
      }),
    });

    const extendData = await extendResponse.json();
    console.log("argontv extend response:", extendData);

    if (!extendResponse.ok || extendData.error || extendData.successful === 0) {
      console.error("argontv extend error:", extendData);
      return new Response(
        JSON.stringify({ error: "Failed to extend line", details: extendData }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Argon TV extend doesn't return the new expiry — calculate it ourselves
    const days = PACKAGE_DAYS[packageId] ?? 30;
    const baseDate = user.expiration_date && new Date(user.expiration_date) > new Date()
      ? new Date(user.expiration_date)
      : new Date();
    const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    // Update expiration_date in users table
    const updateFields: Record<string, unknown> = { expiration_date: newExpiry.toISOString() };
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
        newExpirationDate: newExpiry.toISOString(),
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
