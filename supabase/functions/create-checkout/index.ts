import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const IK_API_BASE = "https://api.ikhokha.com";
const IK_PAYMENT_PATH = "/public-api/v1/api/payment";
const IK_APP_ID = Deno.env.get("IKHOKHA_APP_ID") ?? "";
const IK_APP_SECRET = Deno.env.get("IKHOKHA_APP_SECRET") ?? "";

// Escape string the same way iKhokha's signing algorithm expects
function jsStringEscape(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\u0000/g, "\\0");
}

function signIkPayload(path: string, body: string): string {
  const payload = jsStringEscape(path + body);
  return createHmac("sha256", IK_APP_SECRET).update(payload).digest("hex");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount, reference, customerEmail, customerName, productName, standardSubPlanIds } = await req.json();

    // Validate required fields
    if (!amount || !reference) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, reference" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!IK_APP_ID || !IK_APP_SECRET) {
      console.error("iKhokha credentials not configured");
      return new Response(
        JSON.stringify({ error: "Payment configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build iKhokha payment link request
    const requestBody = {
      entityID: IK_APP_ID,
      amount: Math.round(amount * 100), // Convert rands to cents
      currency: "ZAR",
      requesterUrl: "https://real-tv-stream.vercel.app",
      mode: "live",
      description: productName || "RealTV Order",
      externalTransactionID: reference,
      urls: {
        callbackUrl: "https://bdtgjltygenmxlrifeds.supabase.co/functions/v1/yoco-webhook",
        successPageUrl: `https://real-tv-stream.vercel.app/order-success?reference=${encodeURIComponent(reference)}`,
        failurePageUrl: "https://real-tv-stream.vercel.app/shop",
        cancelUrl: "https://real-tv-stream.vercel.app/shop",
      },
    };

    const bodyStr = JSON.stringify(requestBody);
    const signature = signIkPayload(IK_PAYMENT_PATH, bodyStr);

    console.log("Creating iKhokha payment link for reference:", reference, "amount:", requestBody.amount);

    const response = await fetch(`${IK_API_BASE}${IK_PAYMENT_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "IK-APPID": IK_APP_ID,
        "IK-SIGN": signature,
      },
      body: bodyStr,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("iKhokha API error:", data);
      return new Response(
        JSON.stringify({ error: "Failed to create payment link", details: data }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data.paylinkUrl) {
      console.error("iKhokha response missing paylinkUrl:", data);
      return new Response(
        JSON.stringify({ error: "Invalid payment response", details: data }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("iKhokha payment link created:", data.paylinkID);

    // Return redirectUrl for frontend compatibility
    return new Response(
      JSON.stringify({
        redirectUrl: data.paylinkUrl,
        id: data.paylinkID,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating payment link:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
