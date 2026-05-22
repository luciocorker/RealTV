import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ARGON_API_BASE = "https://distributors.argontv.nl";
const ARGON_API_KEY = "d65811e842c29e7202851ef162e212a2";

// iKhokha callback URL (must match what was sent in create-checkout)
const CALLBACK_URL = "https://bdtgjltygenmxlrifeds.supabase.co/functions/v1/yoco-webhook";

// Map product names stored in tv_box_orders to Argon TV package IDs
const PLAN_MAP: Record<string, { packageId: number; days: number; premium: boolean }> = {
  "Standard Monthly":  { packageId: 113653, days: 30,  premium: false },
  "Premium Monthly":   { packageId: 113653, days: 30,  premium: true  },
  "3-Month Plan":      { packageId: 113654, days: 90,  premium: false },
  "6-Month Plan":      { packageId: 113655, days: 180, premium: false },
  "Yearly Plan":       { packageId: 113656, days: 365, premium: false },
};

function jsStringEscape(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\u0000/g, "\\0");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const payload = await req.text();

    // Verify iKhokha webhook signature
    const ikSign = req.headers.get("ik-sign");
    const appSecret = Deno.env.get("IKHOKHA_APP_SECRET") ?? "";

    if (ikSign && appSecret) {
      const rawSignature = createHmac("sha256", appSecret)
        .update(CALLBACK_URL + payload)
        .digest("hex");

      // Also try with jsStringEscape in case iKhokha escapes the payload
      const escapedSignature = createHmac("sha256", appSecret)
        .update(jsStringEscape(CALLBACK_URL + payload))
        .digest("hex");

      if (ikSign !== rawSignature && ikSign !== escapedSignature) {
        console.error("Invalid iKhokha webhook signature. Got:", ikSign);
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("Signature verification skipped — ik-sign or IKHOKHA_APP_SECRET missing");
    }

    const event = JSON.parse(payload);
    console.log("Received iKhokha webhook:", JSON.stringify(event));

    // iKhokha sends: { paylinkID, status, externalTransactionID, responseCode }
    const status = event.status;
    const responseCode = event.responseCode;
    const reference = event.externalTransactionID;

    if (status !== "SUCCESS" || responseCode !== "00") {
      console.log(`Payment not successful. Status: ${status}, code: ${responseCode}, ref: ${reference}`);
      return new Response(JSON.stringify({ received: true, processed: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Payment succeeded for reference:", reference);

    if (!reference) {
      console.error("No externalTransactionID in webhook payload");
      return new Response(JSON.stringify({ error: "Missing reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update order status in database
    const { data, error } = await supabase
      .from("tv_box_orders")
      .update({
        payment_status: "paid",
        notified: false,
      })
      .eq("payment_reference", reference)
      .select();

    if (error) {
      console.error("Error updating order:", error);
      return new Response(JSON.stringify({ error: "DB update failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Order updated successfully:", data);

    // Extend Argon TV line for subscription products
    if (data && data.length > 0) {
      for (const order of data) {
        const planInfo = PLAN_MAP[order.product_name];
        if (planInfo && order.email) {
          try {
            console.log(`Extending line for ${order.email}, product: ${order.product_name}`);

            const { data: user, error: userError } = await supabase
              .from("users")
              .select("id, line_id, expiration_date")
              .eq("username", order.email)
              .maybeSingle();

            if (userError || !user) {
              console.error(`User not found for ${order.email}:`, userError);
              continue;
            }

            if (!user.line_id) {
              // No existing line — create one
              console.log(`User ${order.email} has no line, creating new Argon TV line`);

              const createResponse = await fetch(`${ARGON_API_BASE}/api/v1/create-line`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-ApiKey": ARGON_API_KEY,
                },
                body: JSON.stringify({ package: planInfo.packageId }),
              });

              const createData = await createResponse.json();
              console.log("Argon TV create-line response:", createData);

              if (!createResponse.ok || createData.error) {
                console.error(`Argon TV create-line failed for ${order.email}:`, createData);
                continue;
              }

              const newExpirationDate = createData.expiration_time
                ? new Date((createData.expiration_time as number) * 1000).toISOString()
                : null;

              await supabase
                .from("users")
                .update({
                  line_username: createData.username,
                  line_password: createData.password,
                  line_id: String(createData.id),
                  expiration_date: newExpirationDate,
                  max_devices: planInfo.premium ? 2 : 1,
                })
                .eq("id", user.id);

              console.log(`New Argon TV line created for ${order.email}: expiry=${newExpirationDate}`);
            } else {
              // Existing line — extend it
              const extendResponse = await fetch(`${ARGON_API_BASE}/api/v1/extend`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-ApiKey": ARGON_API_KEY,
                },
                body: JSON.stringify({
                  lines: [Number(user.line_id)],
                  package: planInfo.packageId,
                }),
              });

              const extendData = await extendResponse.json();
              console.log("Argon TV extend response:", extendData);

              if (!extendResponse.ok || extendData.error || extendData.successful === 0) {
                console.error(`Argon TV extend failed for ${order.email}:`, extendData);
                continue;
              }

              // Argon TV doesn't return new expiry — calculate from current or now
              const baseDate = user.expiration_date && new Date(user.expiration_date) > new Date()
                ? new Date(user.expiration_date)
                : new Date();
              const newExpiry = new Date(baseDate.getTime() + planInfo.days * 24 * 60 * 60 * 1000);

              await supabase
                .from("users")
                .update({
                  expiration_date: newExpiry.toISOString(),
                  max_devices: planInfo.premium ? 2 : 1,
                })
                .eq("id", user.id);

              console.log(`Line extended for ${order.email}: expiry=${newExpiry.toISOString()}`);
            }
          } catch (extendError) {
            console.error(`Error extending line for ${order.email}:`, extendError);
          }
        }
      }
    }

    // Send WhatsApp notifications
    if (data && data.length > 0) {
      const instanceId = Deno.env.get("GREEN_API_INSTANCE_ID");
      const apiToken = Deno.env.get("GREEN_API_TOKEN");
      const notifyNumber = Deno.env.get("WHATSAPP_NOTIFY_NUMBER");

      if (instanceId && apiToken && notifyNumber) {
        const productLines = data.map((item: any) => `• ${item.product_name} — ${item.price}`).join("\n");
        const totalAmount = data.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
        const firstOrder = data[0];

        const hasAddress = data.some((item: any) => item.address && item.address.trim() !== "");
        const addressItem = data.find((item: any) => item.address && item.address.trim() !== "");
        const addressPart = hasAddress && addressItem
          ? `\n\n📍 *Paxi Point:*\n${addressItem.address}`
          : "";

        const message = `🛒 *New Order Paid!*\n\n` +
          `*Products:*\n${productLines}\n\n` +
          `*Total:* R${totalAmount.toLocaleString()}\n` +
          `*Customer:* ${firstOrder.full_name}\n` +
          `*Email:* ${firstOrder.email}\n` +
          `*Phone:* ${firstOrder.phone}` +
          `${addressPart}\n\n` +
          `*Reference:* ${firstOrder.payment_reference}\n` +
          `*Date:* ${new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`;

        try {
          const waResponse = await fetch(
            `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatId: `${notifyNumber}@c.us`, message }),
            }
          );
          console.log("Admin WhatsApp notification sent:", await waResponse.json());

          await supabase
            .from("tv_box_orders")
            .update({ notified: true })
            .eq("payment_reference", reference);
        } catch (waError) {
          console.error("Admin WhatsApp notification failed:", waError);
        }
      }

      // Customer confirmation
      if (instanceId && apiToken) {
        const firstOrder = data[0];
        let customerPhone = firstOrder.phone?.replace(/\D/g, "");
        if (customerPhone) {
          if (customerPhone.startsWith("0")) customerPhone = "27" + customerPhone.slice(1);

          const productLines = data.map((item: any) => `• ${item.product_name}`).join("\n");
          const totalAmount = data.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

          const hasTVBox = data.some((item: any) => {
            const name = (item.product_name || "").toLowerCase();
            return name.includes("box") || name.includes("maxdorf") || name.includes("maverick") || name.includes("qvwi") || name.includes("mecool");
          });

          const addressItem = data.find((item: any) => item.address && item.address.trim() !== "");
          let deliveryPart = "";
          if (hasTVBox && addressItem) {
            deliveryPart = `\n\n📍 *Paxi Collection Point:*\n${addressItem.address}\n🚚 Delivery takes 3–5 business days.`;
          }

          const customerMessage = `✅ *Order Confirmed!*\n\n` +
            `Hi ${firstOrder.full_name},\n\n` +
            `Thank you for your purchase from *RealTV*! 🎉\n\n` +
            `*Your Order:*\n${productLines}\n\n` +
            `*Total Paid:* R${totalAmount.toLocaleString()}` +
            `${deliveryPart}\n\n` +
            `*Reference:* ${firstOrder.payment_reference}\n\n` +
            `If you have any questions, reply to this message. Enjoy RealTV! 📺`;

          try {
            const custWaResponse = await fetch(
              `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chatId: `${customerPhone}@c.us`, message: customerMessage }),
              }
            );
            console.log("Customer WhatsApp confirmation sent:", await custWaResponse.json());
          } catch (custWaError) {
            console.error("Customer WhatsApp confirmation failed:", custWaError);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true, processed: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

