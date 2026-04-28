import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_BASE = "https://tv.extremeiptv.net:8443";
const API_KEY = "LcWopthRUnO4KPbZd89BE9PONzEWRR4C0hsbP4WwyML3Shmj62SFQXW9ZQL2H2NODtYnIiUHTntu9EXf2Clq06cbeMcTmuVO321Q";
const API_AUTH_USER = Deno.env.get("EXTREMEIPTV_AUTH_USER")!;

const PACKAGES: Record<string, number> = {
  "3day-trial": 109,
  "1-month": 101,
  "3-months": 102,
  "6-months": 103,
  "12-months": 104,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { username, packageId } = await req.json();

    if (!username) {
      return new Response(JSON.stringify({ error: "username is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const selectedPackage = PACKAGES[packageId] || PACKAGES["3day-trial"];

    // Call extremeiptv API to create line
    const createResponse = await fetch(`${API_BASE}/ext/line/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": API_KEY,
        "X-Auth-User": API_AUTH_USER,
      },
      body: JSON.stringify({
        package: selectedPackage,
      }),
    });

    const rawText = await createResponse.text();
    console.log("extremeiptv create-line status:", createResponse.status);
    console.log("extremeiptv create-line raw response:", rawText);

    let createData: Record<string, unknown>;
    try {
      createData = JSON.parse(rawText);
    } catch {
      return new Response(JSON.stringify({ error: "extremeiptv API returned non-JSON", raw: rawText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!createResponse.ok || createData.error) {
      console.error("extremeiptv API error:", createData);
      return new Response(JSON.stringify({ error: "Failed to create line", details: createData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lineId = createData.line_id;
    const lineUsername = createData.username as string;
    const linePassword = createData.password as string;
    console.log("Created line ID:", lineId);

    // Update user in Supabase with line credentials
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updateData: Record<string, unknown> = {
      line_username: lineUsername,
      line_password: linePassword,
      line_id: lineId,
    };
    if (createData.expire_at) {
      updateData.expiration_date = createData.expire_at;
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

    // Send WhatsApp trial activation message to customer
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
          `Your *3-day free trial* has been activated! 📺\n\n` +
          `*Your login details:*\n` +
          `• Username: ${userData.username}\n` +
          `• Password: ${userData.password}\n\n` +
          `Download the RealTV app and start streaming now!\n\n` +
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

    return new Response(
      JSON.stringify({
        success: true,
        line_id: lineId,
        line_username: lineUsername,
        line_password: linePassword,
        expiration_time: createData.expire_at,
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
