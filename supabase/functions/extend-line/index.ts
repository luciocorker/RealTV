import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ARGON_API_BASE = "https://distributors.argontv.nl";
const ARGON_API_KEY = "e434f9293543af772518ab99b780ffe0";

// Map subscription plan IDs to ArgonTV package IDs
const PACKAGE_MAP: Record<string, number> = {
  "std-monthly": 113653,       // 1 Month
  "std-premium-monthly": 113653, // 1 Month
  "std-3month": 113654,        // 3 Months
  "std-6month": 113655,        // 6 Months
  "std-yearly": 113656,        // 12 Months
};

// Map plan IDs to duration in months (for expiration date calculation)
const DURATION_MONTHS: Record<string, number> = {
  "std-monthly": 1,
  "std-premium-monthly": 1,
  "std-3month": 3,
  "std-6month": 6,
  "std-yearly": 12,
};

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

    const durationMonths = DURATION_MONTHS[planId] || 1;

    if (!user.line_id) {
      // No existing line — create a new one with the purchased package
      console.log(`User ${userEmail} has no line ID, creating new line`);

      const createResponse = await fetch(`${ARGON_API_BASE}/api/v1/create-line`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ApiKey": ARGON_API_KEY,
        },
        body: JSON.stringify({
          package: packageId,
          template: 1271,
        }),
      });

      const createData = await createResponse.json();
      console.log("ArgonTV create-line response:", createData);

      if (createData.error) {
        console.error("ArgonTV create-line error:", createData);
        return new Response(
          JSON.stringify({ error: "Failed to create line", details: createData }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const newLineId = createData.id || createData.line_id || createData.lineId;
      const newExpiry = new Date();
      newExpiry.setMonth(newExpiry.getMonth() + durationMonths);

      const updateFields: Record<string, unknown> = {
        line_username: createData.username,
        line_password: createData.password,
        expiration_date: newExpiry.toISOString(),
      };
      if (newLineId) {
        updateFields.line_id = newLineId;
      }

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
          line_username: createData.username,
          line_password: createData.password,
          expiration_date: newExpiry.toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Existing line — extend it
    const argonResponse = await fetch(`${ARGON_API_BASE}/api/v1/extend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ApiKey": ARGON_API_KEY,
      },
      body: JSON.stringify({
        lines: [user.line_id],
        package: packageId,
      }),
    });

    const argonData = await argonResponse.json();
    console.log("ArgonTV extend response:", argonData);

    if (argonData.error) {
      console.error("ArgonTV extend error:", argonData);
      return new Response(
        JSON.stringify({ error: "Failed to extend line", details: argonData }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate new expiration date
    const currentExpiry = user.expiration_date
      ? new Date(user.expiration_date)
      : new Date();
    // If current expiry is in the past, start from now
    const baseDate =
      currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + durationMonths);

    // Update expiration_date in users table
    const { error: updateError } = await supabase
      .from("users")
      .update({ expiration_date: newExpiry.toISOString() })
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
        argonResponse: argonData,
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
