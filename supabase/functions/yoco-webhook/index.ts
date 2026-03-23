import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ARGON_API_BASE = "https://distributors.argontv.nl";
const ARGON_API_KEY = "e434f9293543af772518ab99b780ffe0";

// Map product names (as stored in tv_box_orders) to ArgonTV package IDs
const PLAN_MAP: Record<string, { packageId: number; months: number }> = {
  "Standard Monthly":  { packageId: 113653, months: 1 },
  "Premium Monthly":   { packageId: 113653, months: 1 },
  "6-Month Plan":      { packageId: 113655, months: 6 },
  "Yearly Plan":       { packageId: 113656, months: 12 },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Yoco webhook secret from environment
    const webhookSecret = Deno.env.get("YOCO_WEBHOOK_SECRET");

    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get webhook payload
    const payload = await req.text();
    const event = JSON.parse(payload);

    console.log("Received Yoco webhook:", event.type);

    // Verify webhook signature (Yoco sends signature in header)
    const signature = req.headers.get("x-yoco-signature");
    if (signature && webhookSecret) {
      const expectedSignature = createHmac("sha256", webhookSecret)
        .update(payload)
        .digest("hex");
      
      if (signature !== expectedSignature) {
        console.error("Invalid webhook signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Handle payment.succeeded event
    if (event.type === "payment.succeeded") {
      const payment = event.payload;
      const reference = payment.metadata?.reference || payment.reference;

      console.log("Payment succeeded for reference:", reference);

      if (reference) {
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
        } else {
          console.log("Order updated successfully:", data);

          // Extend line for standard subscriptions using order data
          if (data && data.length > 0) {
            for (const order of data) {
              const planInfo = PLAN_MAP[order.product_name];
              if (planInfo && order.email) {
                try {
                  console.log(`Extending line for ${order.email}, product: ${order.product_name}`);

                  // Look up user by email
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
                    // No existing line — create a new one with the purchased package
                    console.log(`User ${order.email} has no line ID, creating new line`);

                    const createResponse = await fetch(`${ARGON_API_BASE}/api/v1/create-line`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "X-ApiKey": ARGON_API_KEY,
                      },
                      body: JSON.stringify({
                        package: planInfo.packageId,
                        template: 1271,
                      }),
                    });

                    const createData = await createResponse.json();
                    console.log("ArgonTV create-line response:", createData);

                    if (createData.error) {
                      console.error(`ArgonTV create-line failed for ${order.email}:`, createData);
                      continue;
                    }

                    const newLineId = createData.id || createData.line_id || createData.lineId;
                    const newExpiry = new Date();
                    newExpiry.setMonth(newExpiry.getMonth() + planInfo.months);

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
                      console.error(`Failed to save new line for ${order.email}:`, createUpdateError);
                    } else {
                      console.log(`New line created for ${order.email}: new expiry=${newExpiry.toISOString()}`);
                    }
                  } else {
                    // Existing line — extend it
                    const argonResponse = await fetch(`${ARGON_API_BASE}/api/v1/extend`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "X-ApiKey": ARGON_API_KEY,
                      },
                      body: JSON.stringify({
                        lines: [user.line_id],
                        package: planInfo.packageId,
                      }),
                    });

                    const argonData = await argonResponse.json();
                    console.log("ArgonTV extend response:", argonData);

                    if (argonData.error) {
                      console.error(`ArgonTV extend failed for ${order.email}:`, argonData);
                      continue;
                    }

                    // Calculate new expiration date
                    const currentExpiry = user.expiration_date
                      ? new Date(user.expiration_date)
                      : new Date();
                    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
                    const newExpiry = new Date(baseDate);
                    newExpiry.setMonth(newExpiry.getMonth() + planInfo.months);

                    // Update expiration_date in users table
                    const { error: updateError } = await supabase
                      .from("users")
                      .update({ expiration_date: newExpiry.toISOString() })
                      .eq("id", user.id);

                    if (updateError) {
                      console.error(`Failed to update expiration for ${order.email}:`, updateError);
                    } else {
                      console.log(`Line extended for ${order.email}: new expiry=${newExpiry.toISOString()}`);
                    }
                  }
                } catch (extendError) {
                  console.error(`Error extending line for ${order.email}:`, extendError);
                }
              }
            }
          }

          // Send WhatsApp notification via Green API
          if (data && data.length > 0) {
            const instanceId = Deno.env.get("GREEN_API_INSTANCE_ID");
            const apiToken = Deno.env.get("GREEN_API_TOKEN");
            const notifyNumber = Deno.env.get("WHATSAPP_NOTIFY_NUMBER");

            if (instanceId && apiToken && notifyNumber) {
              // Build product list from all items in the order
              const productLines = data.map((item: any) => `• ${item.product_name} — ${item.price}`).join("\n");
              const totalAmount = data.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
              const firstOrder = data[0];

              // Check if any item has a Paxi delivery point
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
                    body: JSON.stringify({
                      chatId: `${notifyNumber}@c.us`,
                      message: message,
                    }),
                  }
                );
                const waResult = await waResponse.json();
                console.log("WhatsApp notification sent:", waResult);

                // Mark as notified
                await supabase
                  .from("tv_box_orders")
                  .update({ notified: true })
                  .eq("payment_reference", reference);
              } catch (waError) {
                console.error("WhatsApp notification failed:", waError);
              }
            }

            // Send order confirmation to customer via WhatsApp
            if (instanceId && apiToken && data && data.length > 0) {
              const firstOrder = data[0];
              let customerPhone = firstOrder.phone?.replace(/\D/g, "");
              if (customerPhone) {
                // Normalize SA numbers: 0xx -> 27xx
                if (customerPhone.startsWith("0")) {
                  customerPhone = "27" + customerPhone.slice(1);
                }

                const productLines = data.map((item: any) => `• ${item.product_name}`).join("\n");
                const totalAmount = data.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

                const hasTVBox = data.some((item: any) => {
                  const name = (item.product_name || "").toLowerCase();
                  return name.includes("box") || name.includes("maxdorf") || name.includes("maverick") || name.includes("qvwi") || name.includes("mecool");
                });

                const hasAddress = data.some((item: any) => item.address && item.address.trim() !== "");
                const addressItem = data.find((item: any) => item.address && item.address.trim() !== "");

                let deliveryPart = "";
                if (hasTVBox && hasAddress && addressItem) {
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
                      body: JSON.stringify({
                        chatId: `${customerPhone}@c.us`,
                        message: customerMessage,
                      }),
                    }
                  );
                  const custWaResult = await custWaResponse.json();
                  console.log("Customer WhatsApp confirmation sent:", custWaResult);
                } catch (custWaError) {
                  console.error("Customer WhatsApp confirmation failed:", custWaError);
                }
              }
            }
          }
        }
      }
    }

    // Handle payment.failed event
    if (event.type === "payment.failed") {
      const payment = event.payload;
      const reference = payment.metadata?.reference || payment.reference;

      if (reference) {
        await supabase
          .from("tv_box_orders")
          .update({ payment_status: "failed" })
          .eq("payment_reference", reference);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
