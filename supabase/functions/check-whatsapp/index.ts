import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone) {
      return new Response(JSON.stringify({ error: "phone is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize SA numbers: 0xx -> 27xx
    let normalized = phone.replace(/\D/g, "");
    if (normalized.startsWith("0")) normalized = "27" + normalized.slice(1);

    const instanceId = Deno.env.get("GREEN_API_INSTANCE_ID");
    const apiToken = Deno.env.get("GREEN_API_TOKEN");

    if (!instanceId || !apiToken) {
      // Green API not configured — fail open so registration isn't blocked
      return new Response(JSON.stringify({ exists: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(
      `https://api.green-api.com/waInstance${instanceId}/checkWhatsapp/${apiToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: parseInt(normalized, 10) }),
      }
    );

    if (!response.ok) {
      // Green API request failed — fail open
      console.error("checkWhatsapp HTTP error:", response.status);
      return new Response(JSON.stringify({ exists: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("checkWhatsapp result:", data);

    // Only return false when Green API explicitly confirms the number doesn't exist
    const exists = data.existsWhatsapp !== false;

    return new Response(
      JSON.stringify({ exists }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    // Any unexpected error — fail open so registration isn't blocked
    console.error("check-whatsapp error:", err);
    return new Response(JSON.stringify({ exists: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
