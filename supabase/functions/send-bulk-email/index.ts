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

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const defaultSender = Deno.env.get("EMAIL_SENDER") || "renew@realtv.co.za";

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Resend API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, htmlContent, textContent, target, userIds, template, adminUserId, senderEmail } = await req.json();

    // Verify the caller is an admin via adminUserId database lookup
    if (!adminUserId) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: adminUser } = await supabase.from("users").select("user_type").eq("id", adminUserId).single();
    if (adminUser?.user_type !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if ((!subject && !template) || !target) {
      return new Response(
        JSON.stringify({ error: "subject (or template) and target are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch users based on target
    let users;
    if (target === "selected" && Array.isArray(userIds) && userIds.length > 0) {
      const { data, error: usersError } = await supabase
        .from("users")
        .select("id, name, username, expiration_date, user_type")
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
        .select("id, name, username, expiration_date, user_type")
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

    const usersWithEmail = (users || []).filter(
      (u) => u.username && u.username.trim() !== "" && u.username.includes("@")
    );

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process emails in batches to avoid timeout while maintaining error handling
    const BATCH_SIZE = 10; // Send up to 10 emails concurrently
    const batches: typeof usersWithEmail[] = [];
    
    for (let i = 0; i < usersWithEmail.length; i += BATCH_SIZE) {
      batches.push(usersWithEmail.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      // Process each batch concurrently
      await Promise.all(
        batch.map(async (user) => {
          // Personalize content
          const daysRemaining = user.expiration_date
            ? Math.ceil((new Date(user.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : 0;

          const personalizedSubject = subject
            ? subject
                .replace(/\{name\}/gi, user.name || "Customer")
                .replace(/\{email\}/gi, user.username || "")
                .replace(/\{days\}/gi, String(Math.max(0, daysRemaining)))
            : "";

          const personalizedHtml = htmlContent
            ? htmlContent
                .replace(/\{name\}/gi, user.name || "Customer")
                .replace(/\{email\}/gi, user.username || "")
                .replace(/\{days\}/gi, String(Math.max(0, daysRemaining)))
            : "";

          const personalizedText = textContent
            ? textContent
                .replace(/\{name\}/gi, user.name || "Customer")
                .replace(/\{email\}/gi, user.username || "")
                .replace(/\{days\}/gi, String(Math.max(0, daysRemaining)))
            : "";

          try {
            const resendResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: senderEmail || defaultSender,
                to: [user.username],
                subject: personalizedSubject,
                html: personalizedHtml || undefined,
                text: personalizedText || undefined,
              }),
            });

            const resendResult = await resendResponse.json();
            if (resendResponse.ok && resendResult.id) {
              sent++;
            } else {
              failed++;
              errors.push(`${user.name || user.username}: ${JSON.stringify(resendResult)}`);
            }
          } catch (err) {
            failed++;
            errors.push(`${user.name || user.username}: ${err.message}`);
          }
        })
      );

      // Small delay between batches to avoid rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    return new Response(
      JSON.stringify({
        total: usersWithEmail.length,
        sent,
        failed,
        skippedNoEmail: (users || []).length - usersWithEmail.length,
        errors: errors.slice(0, 10),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Bulk email error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});