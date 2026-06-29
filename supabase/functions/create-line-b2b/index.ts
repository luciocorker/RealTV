import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const API_BASE = Deno.env.get("B2B_API_BASE_URL")!;
const API_KEY = Deno.env.get("B2B_API_KEY")!;
const AUTH_USER = Deno.env.get("B2B_AUTH_USER")!;

// 24-hour trial package for premium users
const TRIAL_PACKAGE = 118;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();
    console.log("[B2B] Received request for username:", username);

    if (!username) {
      console.error("[B2B] Missing username in request");
      return new Response(JSON.stringify({ error: "username is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rid = crypto.randomUUID();
    console.log("[B2B] Using package:", TRIAL_PACKAGE, "rid:", rid);
    console.log("[B2B] API_BASE:", API_BASE);

    // Call B2B Billing API to create trial line
    console.log("[B2B] Calling B2B API...");
    const createResponse = await fetch(`${API_BASE}/ext/line/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": API_KEY,
        "X-Auth-User": AUTH_USER,
      },
      body: JSON.stringify({
        package: TRIAL_PACKAGE,
        rid,
      }),
    });

    const rawText = await createResponse.text();
    console.log("[B2B] create-line status:", createResponse.status);
    console.log("[B2B] create-line raw response:", rawText);

    let createData: Record<string, unknown>;
    try {
      createData = JSON.parse(rawText);
    } catch (parseError) {
      console.error("[B2B] Failed to parse JSON response:", parseError);
      return new Response(JSON.stringify({ error: "B2B API returned non-JSON", raw: rawText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!createResponse.ok || createData.error) {
      console.error("[B2B] API error:", createData);
      return new Response(JSON.stringify({ error: "Failed to create line", details: createData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[B2B] Full response data:", createData);

    const lineId = createData.line_id as string;
    const lineUsername = createData.username as string;
    const linePassword = createData.password as string;
    console.log("[B2B] Created line - ID:", lineId, "username:", lineUsername);

    // B2B doesn't return expire_at, calculate 24 hours from now
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24);
    const finalExpireAt = expiryDate.toISOString();
    console.log("[B2B] Calculated expiration (24h trial):", finalExpireAt);

    // Update user in Supabase with line credentials
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("[B2B] Updating user in Supabase...");

    const updateData: Record<string, unknown> = {
      line_username: lineUsername,
      line_password: linePassword,
      line_id: lineId,
      expiration_date: finalExpireAt,
    };

    const { error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("username", username);

    if (updateError) {
      console.error("[B2B] Error updating user with line credentials:", updateError);
      return new Response(JSON.stringify({ error: "Line created but failed to save credentials", details: updateError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[B2B] Successfully updated user and created line");
    return new Response(
      JSON.stringify({
        success: true,
        line_id: lineId,
        line_username: lineUsername,
        line_password: linePassword,
        expire_at: finalExpireAt,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[B2B] Unexpected error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
