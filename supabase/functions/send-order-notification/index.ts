import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { reference } = await req.json();

    if (!reference) {
      return new Response(JSON.stringify({ error: "Missing reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all order rows for this reference
    const { data: orders, error } = await supabase
      .from("tv_box_orders")
      .select("*")
      .eq("payment_reference", reference)
      .eq("payment_status", "paid");

    if (error || !orders || orders.length === 0) {
      console.error("Order not found or not paid yet:", error);
      return new Response(JSON.stringify({ error: "Order not found or not paid" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already notified — avoid duplicate WhatsApp messages
    const alreadyNotified = orders.every((o: any) => o.notified === true);
    if (alreadyNotified) {
      console.log("Order already notified, skipping:", reference);
      return new Response(JSON.stringify({ sent: false, reason: "already_notified" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const instanceId = Deno.env.get("GREEN_API_INSTANCE_ID");
    const apiToken = Deno.env.get("GREEN_API_TOKEN");
    const notifyNumber = Deno.env.get("WHATSAPP_NOTIFY_NUMBER");

    if (!instanceId || !apiToken) {
      console.error("Green API credentials not configured");
      return new Response(JSON.stringify({ error: "WhatsApp credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstOrder = orders[0];
    const productLines = orders.map((item: any) => `• ${item.product_name} — ${item.price}`).join("\n");
    const totalAmount = orders.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

    // ── Admin notification ──────────────────────────────────────────────────
    if (notifyNumber) {
      const hasAddress = orders.some((item: any) => item.address && item.address.trim() !== "");
      const addressItem = orders.find((item: any) => item.address && item.address.trim() !== "");
      const addressPart = hasAddress && addressItem
        ? `\n\n📍 *Paxi Point:*\n${addressItem.address}`
        : "";

      const adminMessage =
        `🛒 *New Order Paid!*\n\n` +
        `*Products:*\n${productLines}\n\n` +
        `*Total:* R${totalAmount.toLocaleString()}\n` +
        `*Customer:* ${firstOrder.full_name}\n` +
        `*Email:* ${firstOrder.email}\n` +
        `*Phone:* ${firstOrder.phone}` +
        `${addressPart}\n\n` +
        `*Reference:* ${firstOrder.payment_reference}\n` +
        `*Date:* ${new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`;

      try {
        const adminRes = await fetch(
          `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId: `${notifyNumber}@c.us`, message: adminMessage }),
          }
        );
        console.log("Admin WhatsApp sent:", await adminRes.json());
      } catch (e) {
        console.error("Admin WhatsApp failed:", e);
      }
    }

    // ── Customer confirmation ───────────────────────────────────────────────
    let customerPhone = firstOrder.phone?.replace(/\D/g, "");
    if (customerPhone) {
      if (customerPhone.startsWith("0")) customerPhone = "27" + customerPhone.slice(1);

      const customerProductLines = orders.map((item: any) => `• ${item.product_name}`).join("\n");

      const hasTVBox = orders.some((item: any) => {
        const name = (item.product_name || "").toLowerCase();
        return (
          name.includes("box") ||
          name.includes("maxdorf") ||
          name.includes("maverick") ||
          name.includes("qvwi") ||
          name.includes("mecool")
        );
      });

      const addressItem = orders.find((item: any) => item.address && item.address.trim() !== "");
      let deliveryPart = "";
      if (hasTVBox && addressItem) {
        deliveryPart =
          `\n\n📍 *Paxi Collection Point:*\n${addressItem.address}\n🚚 Delivery takes 3–5 business days.`;
      }

      const customerMessage =
        `✅ *Order Confirmed!*\n\n` +
        `Hi ${firstOrder.full_name},\n\n` +
        `Thank you for your purchase from *RealTV*! 🎉\n\n` +
        `*Your Order:*\n${customerProductLines}\n\n` +
        `*Total Paid:* R${totalAmount.toLocaleString()}` +
        `${deliveryPart}\n\n` +
        `*Reference:* ${firstOrder.payment_reference}\n\n` +
        `If you have any questions, reply to this message. Enjoy RealTV! 📺`;

      try {
        const custRes = await fetch(
          `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId: `${customerPhone}@c.us`, message: customerMessage }),
          }
        );
        console.log("Customer WhatsApp sent:", await custRes.json());
      } catch (e) {
        console.error("Customer WhatsApp failed:", e);
      }
    }

    // Mark all rows for this reference as notified
    await supabase
      .from("tv_box_orders")
      .update({ notified: true })
      .eq("payment_reference", reference);

    return new Response(JSON.stringify({ sent: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-order-notification error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
