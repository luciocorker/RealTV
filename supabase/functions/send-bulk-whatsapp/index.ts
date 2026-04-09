import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const instanceId = Deno.env.get("GREEN_API_INSTANCE_ID");
    const apiToken = Deno.env.get("GREEN_API_TOKEN");

    if (!instanceId || !apiToken) {
      return new Response(
        JSON.stringify({ error: "Green API credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { message, target, adminUserId, userIds, linkUrl, imageUrl } = await req.json();

    // Verify the caller is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", adminUserId)
      .single();

    if (adminError || !adminUser || adminUser.user_type !== "admin") {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!message || !target) {
      return new Response(
        JSON.stringify({ error: "message and target are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch users based on target
    let users;
    if (target === "selected" && Array.isArray(userIds) && userIds.length > 0) {
      const { data, error: usersError } = await supabase
        .from("users")
        .select("id, name, username, whatsapp_number, expiration_date")
        .in("id", userIds);
      if (usersError) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch users", details: usersError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      users = data;
    } else {
      let query = supabase
        .from("users")
        .select("id, name, username, whatsapp_number, expiration_date")
        .neq("user_type", "admin");

      if (target === "expired") {
        query = query.lt("expiration_date", new Date().toISOString());
      } else if (target === "active") {
        query = query.gte("expiration_date", new Date().toISOString());
      }

      const { data, error: usersError } = await query;
      if (usersError) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch users", details: usersError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      users = data;
    }

    const usersWithPhone = (users || []).filter(
      (u) => u.whatsapp_number && u.whatsapp_number.trim() !== ""
    );

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const user of usersWithPhone) {
      let phone = user.whatsapp_number.replace(/\D/g, "");
      // Normalize SA numbers: 0xx -> 27xx
      if (phone.startsWith("0")) {
        phone = "27" + phone.slice(1);
      }

      // Personalize message
      const personalizedMessage = message
        .replace(/\{name\}/gi, user.name || "Customer")
        .replace(/\{email\}/gi, user.username || "");

      // Append link URL to message if provided
      const fullMessage = linkUrl
        ? `${personalizedMessage}\n\n${linkUrl}`
        : personalizedMessage;

      try {
        let waResponse;

        if (imageUrl) {
          // Send image with caption using sendFileByUrl
          const fileName = imageUrl.split("/").pop()?.split("?")[0] || "image.jpg";
          waResponse = await fetch(
            `https://api.green-api.com/waInstance${instanceId}/sendFileByUrl/${apiToken}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chatId: `${phone}@c.us`,
                urlFile: imageUrl,
                fileName,
                caption: fullMessage,
              }),
            }
          );
        } else {
          waResponse = await fetch(
            `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chatId: `${phone}@c.us`,
                message: fullMessage,
                linkPreview: !!linkUrl,
              }),
            }
          );
        }

        const waResult = await waResponse.json();
        if (waResult.idMessage) {
          sent++;
        } else {
          failed++;
          errors.push(`${user.name || user.username}: ${JSON.stringify(waResult)}`);
        }
      } catch (err) {
        failed++;
        errors.push(`${user.name || user.username}: ${err.message}`);
      }

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    }

    return new Response(
      JSON.stringify({
        total: usersWithPhone.length,
        sent,
        failed,
        skippedNoPhone: (users || []).length - usersWithPhone.length,
        errors: errors.slice(0, 10),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Bulk WhatsApp error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
