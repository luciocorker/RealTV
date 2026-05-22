import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-migration-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Guard: require a migration secret to prevent accidental runs
  const secret = req.headers.get("x-migration-secret");
  const expectedSecret = Deno.env.get("MIGRATION_SECRET");
  if (!expectedSecret || secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Fetch all users that still have a plaintext password
  const { data: users, error: fetchError } = await supabaseAdmin
    .from("users")
    .select("id, username, password")
    .not("password", "is", null);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let migrated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const user of users ?? []) {
    if (!user.password) { skipped++; continue; }

    // Supabase Auth requires valid email — non-email usernames get @realtv.local suffix
    const email = user.username.includes("@") ? user.username : `${user.username}@realtv.local`;

    // Call GoTrue admin REST API directly so we can preserve the existing UUID
    const res = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/auth/v1/admin/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          id: user.id,
          email: email,
          password: user.password,
          email_confirm: true,
        }),
      }
    );

    if (res.status === 422) {
      // User already exists in auth — skip
      skipped++;
    } else if (!res.ok) {
      const body = await res.text();
      errors.push(`${user.id} (${user.username}): ${res.status} ${body.slice(0, 120)}`);
    } else {
      migrated++;
    }
  }

  return new Response(
    JSON.stringify({ migrated, skipped, errors, total: (users ?? []).length }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
