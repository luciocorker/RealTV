import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount, reference, customerEmail, customerName, productName, lineItems, standardSubPlanIds } = await req.json();

    // Validate required fields
    if (!amount || !reference) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, reference" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Yoco secret key from environment
    const YOCO_SECRET_KEY = Deno.env.get("YOCO_SECRET_KEY");
    if (!YOCO_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Payment configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Yoco checkout
    const response = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${YOCO_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert rands to cents for Yoco API
        currency: "ZAR",
        successUrl: `https://real-tv-stream.vercel.app/order-success?reference=${encodeURIComponent(reference)}`,
        cancelUrl: `https://real-tv-stream.vercel.app/shop`,
        failureUrl: `https://real-tv-stream.vercel.app/shop`,
        lineItems: lineItems && lineItems.length > 0
          ? lineItems.map((item: { displayName: string; quantity: number; pricingDetails: { price: number } }) => ({
              displayName: String(item.displayName),
              quantity: Math.round(item.quantity),
              pricingDetails: {
                price: Math.round(item.pricingDetails.price),
              },
            }))
          : [
              {
                displayName: productName || "TV Box",
                quantity: 1,
                pricingDetails: {
                  price: amount * 100,
                },
              },
            ],
        metadata: {
          reference: reference,
          productName: productName || "",
          customerEmail: customerEmail || "",
          customerName: customerName || "",
          standardSubPlanIds: standardSubPlanIds?.length ? standardSubPlanIds.join(",") : "",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Yoco API error:", data);
      return new Response(
        JSON.stringify({ error: "Failed to create checkout", details: data }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the checkout redirect URL
    return new Response(
      JSON.stringify({ 
        redirectUrl: data.redirectUrl,
        id: data.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating checkout:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
