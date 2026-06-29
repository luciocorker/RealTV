import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ARGON_API_BASE = "https://distributors.argontv.nl";
const ARGON_API_KEY = "d65811e842c29e7202851ef162e212a2";

const B2B_API_BASE = Deno.env.get("B2B_API_BASE_URL")!;
const B2B_API_KEY = Deno.env.get("B2B_API_KEY")!;
const B2B_AUTH_USER = Deno.env.get("B2B_AUTH_USER")!;

// Standard plans -> ArgonTV package IDs
const ARGON_PACKAGE_MAP: Record<string, number> = {
  "std-monthly": 113653,           // 1 Month
  "std-3month": 113654,            // 3 Months
  "std-6month": 113655,            // 6 Months
  "std-yearly": 113656,            // 12 Months
};

// Premium plans -> B2B package IDs
const B2B_PACKAGE_MAP: Record<string, number> = {
  "std-premium-monthly": 101,      // 1 Month
  "std-premium-3month": 102,       // 3 Months
  "std-premium-6month": 103,       // 6 Months
  "std-premium-yearly": 104,       // 12 Months
};

// Duration in days per package for calculating new expiry
const PACKAGE_DAYS: Record<number, number> = {
  // ArgonTV
  113653: 30,
  113654: 90,
  113655: 180,
  113656: 365,
  // B2B
  101: 30,
  102: 90,
  103: 180,
  104: 365,
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

    // Look up user by email first to determine which API to use
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, line_id, line_username, line_password, expiration_date, user_type")
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

    const isPremium = user.user_type === "premium";
    const packageMap = isPremium ? B2B_PACKAGE_MAP : ARGON_PACKAGE_MAP;
    const packageId = packageMap[planId];
    if (!packageId) {
      return new Response(
        JSON.stringify({ error: `Unknown plan ID: ${planId}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!user.line_id) {
      // No existing line — create a new one with the purchased package
      console.log(`User ${userEmail} has no line ID, creating new line`);

      const lineUsername = `user_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
      const linePassword = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

      let newLineId: string;
      let newLineUsername: string;
      let newLinePassword: string;
      let newExpirationDate: string | null;

      if (isPremium) {
        // Create line via B2B API
        const createResponse = await fetch(`${B2B_API_BASE}/ext/line/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": B2B_API_KEY,
            "X-Auth-User": B2B_AUTH_USER,
          },
          body: JSON.stringify({
            package: packageId,
            rid: crypto.randomUUID(),
          }),
        });

        const createData = await createResponse.json();
        console.log("B2B create-line response:", createData);

        if (!createResponse.ok || createData.error) {
          console.error("B2B create-line error:", createData);
          return new Response(
            JSON.stringify({ error: "Failed to create line", details: createData }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        newLineId = createData.line_id as string;
        newLineUsername = createData.username as string;
        newLinePassword = createData.password as string;
        newExpirationDate = createData.expire_at as string;
      } else {
        // Create line via ArgonTV API
        const createResponse = await fetch(`${ARGON_API_BASE}/api/v1/create-line`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-ApiKey": ARGON_API_KEY,
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

        newLineId = String(createData.id);
        newLineUsername = createData.username as string;
        newLinePassword = createData.password as string;
        newExpirationDate = createData.expiration_time
          ? new Date((createData.expiration_time as number) * 1000).toISOString()
          : null;
      }

      const updateFields: Record<string, unknown> = {
        line_username: newLineUsername,
        line_password: newLinePassword,
        line_id: newLineId,
        expiration_date: newExpirationDate,
        max_devices: isPremium ? 2 : 1,
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
    let extendResponse: Response;
    let extendData: Record<string, unknown>;

    if (isPremium) {
      // Extend via B2B API
      extendResponse = await fetch(`${B2B_API_BASE}/ext/line/${user.line_id}/renew`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": B2B_API_KEY,
          "X-Auth-User": B2B_AUTH_USER,
        },
        body: JSON.stringify({
          package: packageId,
          rid: crypto.randomUUID(),
        }),
      });

      extendData = await extendResponse.json();
      console.log("B2B renew response:", extendData);

      if (!extendResponse.ok || extendData.error) {
        console.error("B2B renew error:", extendData);
        return new Response(
          JSON.stringify({ error: "Failed to extend line", details: extendData }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // Extend via ArgonTV API
      extendResponse = await fetch(`${ARGON_API_BASE}/api/v1/extend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ApiKey": ARGON_API_KEY,
        },
        body: JSON.stringify({
          lines: [Number(user.line_id)],
          package: packageId,
        }),
      });

      extendData = await extendResponse.json();
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
    }

    // Calculate new expiry (both APIs may not return it directly)
    const days = PACKAGE_DAYS[packageId] ?? 30;
    const baseDate = user.expiration_date && new Date(user.expiration_date) > new Date()
      ? new Date(user.expiration_date)
      : new Date();
    const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    // Update expiration_date in users table
    const updateFields: Record<string, unknown> = { expiration_date: newExpiry.toISOString() };
    if (isPremium) updateFields.max_devices = 2;
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
