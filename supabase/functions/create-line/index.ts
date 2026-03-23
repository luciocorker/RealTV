import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ARGON_API_BASE = "https://distributors.argontv.nl";
const ARGON_API_KEY = "e434f9293543af772518ab99b780ffe0";

// Package IDs
const PACKAGES: Record<string, number> = {
  "24h-test": 113657,
  "3h-test": 113658,
  "1-month": 113653,
  "3-months": 113654,
  "6-months": 113655,
  "12-months": 113656,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, packageId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const selectedPackage = PACKAGES[packageId] || PACKAGES["24h-test"];

    // Call ArgonTV API to create line
    const argonResponse = await fetch(`${ARGON_API_BASE}/api/v1/create-line`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ApiKey": ARGON_API_KEY,
      },
      body: JSON.stringify({
        package: selectedPackage,
        template: 1271,
      }),
    });

    const argonData = await argonResponse.json();

    console.log("ArgonTV create-line full response:", JSON.stringify(argonData));

    if (argonData.error) {
      console.error("ArgonTV API error:", argonData);
      return new Response(JSON.stringify({ error: "Failed to create line", details: argonData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract line ID - try common field names from API response
    const lineId = argonData.id || argonData.line_id || argonData.lineId;
    console.log("Extracted line ID:", lineId);

    // Update user in Supabase with line credentials
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Only include line_id if it exists, so the update doesn't fail
    const updateData: Record<string, unknown> = {
      line_username: argonData.username,
      line_password: argonData.password,
    };
    if (lineId) {
      updateData.line_id = lineId;
    }

    const { error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user with line credentials:", updateError);
      return new Response(JSON.stringify({ error: "Line created but failed to save credentials", details: updateError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        line_id: argonData.id,
        line_username: argonData.username,
        line_password: argonData.password,
        m3u_link: argonData.m3u_download_link,
        expiration_time: argonData.expiration_time,
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
