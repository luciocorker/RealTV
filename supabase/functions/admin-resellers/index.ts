import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const action = body?.action as string;

    // Every action re-verifies the admin's credentials server-side
    const verifyAdmin = async () => {
      const username = String(body?.adminUsername ?? "").trim();
      const password = String(body?.adminPassword ?? "");
      if (!username || !password) {
        throw new Error("Admin session expired — please sign out and sign in again on the Admin page");
      }

      const lookup = async (u: string) => {
        const { data, error } = await supabase
          .from("users")
          .select("id, username, password, user_type")
          .eq("username", u)
          .limit(1);
        if (error) throw new Error("Database error: " + error.message);
        return data?.[0];
      };

      // The site login matches usernames exactly as stored (case-sensitive),
      // so try the exact value first, then fall back to the lowercased email.
      let row = await lookup(username);
      if (!row) row = await lookup(username.toLowerCase());

      if (!row || row.password !== password) {
        throw new Error("Invalid admin credentials");
      }
      if (row.user_type !== "admin") {
        throw new Error("Admin access only");
      }
      return row;
    };

    // ---- CREATE RESELLER: new login account with a 0-credit balance ----
    if (action === "create") {
      await verifyAdmin();
      const name = String(body?.name ?? "").trim();
      const email = String(body?.email ?? "").trim().toLowerCase();
      const whatsapp = String(body?.whatsapp ?? "").trim();
      const password = String(body?.password ?? "");
      if (!name || !email || !whatsapp || !password) {
        return json({ error: "Name, email, WhatsApp number and password are required" }, 400);
      }

      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("username", email)
        .limit(1);
      if (existing && existing.length > 0) {
        return json({ error: "A user with this email already exists" }, 400);
      }

      // Far-future expiry keeps resellers out of the "expired" filters;
      // resellers are portal logins, not subscriptions.
      const farFuture = new Date("2099-01-01T00:00:00Z").toISOString();

      const { data: created, error: insertError } = await supabase
        .from("users")
        .insert({
          username: email,
          password,
          name,
          whatsapp_number: whatsapp,
          user_type: "reseller",
          credits: 0,
          expiration_date: farFuture,
        })
        .select("id, username, name, whatsapp_number, credits")
        .single();
      if (insertError) {
        return json({ error: "Failed to create reseller: " + insertError.message }, 500);
      }

      return json({ success: true, reseller: created });
    }

    // ---- GRANT CREDITS: add (or deduct with a negative amount) ----
    if (action === "grant") {
      const admin = await verifyAdmin();
      const resellerId = String(body?.resellerId ?? "");
      const amount = Number(body?.amount);
      const note = String(body?.note ?? "").trim() || null;
      if (!resellerId) return json({ error: "Reseller is required" }, 400);
      if (!Number.isFinite(amount) || amount === 0) {
        return json({ error: "Enter a non-zero credit amount" }, 400);
      }

      const { data, error } = await supabase.rpc("grant_credits", {
        p_reseller_id: resellerId,
        p_amount: Math.round(amount),
        p_note: note,
        p_performed_by: admin.id,
      });
      if (error) return json({ error: error.message }, 400);

      return json({ success: true, credits: Array.isArray(data) ? data[0] : data });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[admin-resellers] error:", message);
    return json({ error: message }, 400);
  }
});
