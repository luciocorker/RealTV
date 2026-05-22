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

  try {
    // Create admin client with service role key (bypasses RLS, can delete auth users)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { userIds, deleteAll, adminUserId } = await req.json();

    // Verify the caller is an admin via adminUserId database lookup
    if (!adminUserId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("users")
      .select("user_type")
      .eq("id", adminUserId)
      .single();

    if (callerProfile?.user_type !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let idsToDelete: string[] = [];

    if (deleteAll) {
      // Fetch all non-admin user IDs
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("id")
        .neq("user_type", "admin");
      if (error) throw error;
      idsToDelete = (data ?? []).map((u: { id: string }) => u.id);
    } else if (Array.isArray(userIds) && userIds.length > 0) {
      idsToDelete = userIds;
    } else {
      return new Response(JSON.stringify({ error: "No users specified" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let deleted = 0;
    const errors: string[] = [];

    for (const id of idsToDelete) {
      // Delete from auth.users — this cascades to the users table if FK is set up,
      // otherwise we also delete from users table explicitly below.
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) {
        errors.push(`${id}: ${error.message}`);
      } else {
        deleted++;
      }
    }

    // Fallback: also delete from users table in case there's no cascade
    if (idsToDelete.length > 0) {
      await supabaseAdmin.from("users").delete().in("id", idsToDelete);
    }

    return new Response(
      JSON.stringify({ deleted, failed: errors.length, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
