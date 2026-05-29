import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_BASE = "https://distributors.argontv.nl";
const API_KEY = "d65811e842c29e7202851ef162e212a2";

// 24-hour test trial
const TRIAL_PACKAGE = 113657;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { username, send_whatsapp } = await req.json();

    if (!username) {
      return new Response(JSON.stringify({ error: "username is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Argon TV API to create trial line
    const createResponse = await fetch(`${API_BASE}/api/v1/create-line`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ApiKey": API_KEY,
      },
      body: JSON.stringify({ package: TRIAL_PACKAGE, template: 1996 }),
    });

    const rawText = await createResponse.text();
    console.log("argontv create-line status:", createResponse.status);
    console.log("argontv create-line raw response:", rawText);

    let createData: Record<string, unknown>;
    try {
      createData = JSON.parse(rawText);
    } catch {
      return new Response(JSON.stringify({ error: "argontv API returned non-JSON", raw: rawText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!createResponse.ok || createData.error) {
      console.error("argontv API error:", createData);
      return new Response(JSON.stringify({ error: "Failed to create line", details: createData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lineId = createData.id as number;
    const lineUsername = createData.username as string;
    const linePassword = createData.password as string;
    const expirationTime = createData.expiration_time as number;
    console.log("Created line ID:", lineId);

    // Update user in Supabase with line credentials
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updateData: Record<string, unknown> = {
      line_username: lineUsername,
      line_password: linePassword,
      line_id: String(lineId),
    };
    if (expirationTime) {
      updateData.expiration_date = new Date(expirationTime * 1000).toISOString();
    }

    const { error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("username", username);

    if (updateError) {
      console.error("Error updating user with line credentials:", updateError);
      return new Response(JSON.stringify({ error: "Line created but failed to save credentials", details: updateError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const shouldSendWhatsapp = send_whatsapp !== false;

    // Send WhatsApp trial activation message only when enabled.
    if (shouldSendWhatsapp) {
      // Fire and forget so it doesn't block the response.
      (async () => {
        try {
          const { data: userData } = await supabase
            .from("users")
            .select("name, whatsapp_number, username, password")
            .eq("username", username)
            .maybeSingle();

          const instanceId = Deno.env.get("GREEN_API_INSTANCE_ID");
          const apiToken = Deno.env.get("GREEN_API_TOKEN");

          if (instanceId && apiToken && userData?.whatsapp_number) {
            let phone = userData.whatsapp_number.replace(/\D/g, "");
            if (phone.startsWith("0")) phone = "27" + phone.slice(1);

            const message =
              `🎉 *Welcome to RealTV, ${userData.name || username}!*\n\n` +
              `Your *1-day free trial* has been activated! 📺\n\n` +
              `*Your login details:*\n` +
              `• Username: ${userData.username}\n` +
              `• Password: ${userData.password}\n\n` +
              `Download the RealTV app and start streaming now!\n\n` +
              `*Want DStv channels? Reply to this message with* *"DSTV"* *and we'll get you set up!* 📡\n\n` +
              `If you need help, just reply to this message. Enjoy! 🚀`;

            await fetch(
              `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chatId: `${phone}@c.us`, message }),
              }
            );
            console.log("Trial WhatsApp sent to:", phone);
          }
        } catch (waErr) {
          console.error("Trial WhatsApp failed:", waErr);
        }
      })();
    }

    return new Response(
      JSON.stringify({
        success: true,
        line_id: lineId,
        line_username: lineUsername,
        line_password: linePassword,
        expiration_time: expirationTime,
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
