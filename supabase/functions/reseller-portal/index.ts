import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Server-side plan map — the client's requested plan id is translated here,
// so credit costs and durations can never be tampered with from the browser.
const PLANS: Record<string, { label: string; cost: number; days: number }> = {
  "1m": { label: "1 Month", cost: 1, days: 30 },
  "2m": { label: "2 Months", cost: 2, days: 60 },
  "3m": { label: "3 Months", cost: 3, days: 90 },
  "6m": { label: "6 Months", cost: 5, days: 180 },
  "1y": { label: "1 Year", cost: 10, days: 365 },
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

    // Every action re-verifies the reseller's credentials server-side
    const verifyReseller = async () => {
      const username = String(body?.username ?? "").trim();
      const password = String(body?.password ?? "");
      if (!username || !password) {
        throw new Error("Reseller email and password are required");
      }

      const lookup = async (u: string) => {
        const { data, error } = await supabase
          .from("users")
          .select("id, username, name, whatsapp_number, credits, password, user_type")
          .eq("username", u)
          .limit(1);
        if (error) throw new Error("Database error: " + error.message);
        return data?.[0];
      };

      // Try the exact stored username first (site login is case-sensitive),
      // then fall back to the lowercased email.
      let row = await lookup(username);
      if (!row) row = await lookup(username.toLowerCase());

      if (!row || row.password !== password) {
        throw new Error("Invalid email or password");
      }
      if (row.user_type !== "reseller" && row.user_type !== "sub_reseller") {
        throw new Error("This account is not a reseller account");
      }
      return row;
    };

    // ---- LOGIN: verify credentials and return the reseller profile ----
    if (action === "login") {
      const r = await verifyReseller();
      return json({
        success: true,
        reseller: {
          id: r.id,
          name: r.name,
          username: r.username,
          whatsapp_number: r.whatsapp_number,
          credits: r.credits,
          user_type: r.user_type,
        },
      });
    }

    // ---- LOOKUP: find any account by email (no credits spent) ----
    if (action === "lookup") {
      await verifyReseller();
      const email = String(body?.email ?? "").trim();
      if (!email) return json({ error: "Email is required" }, 400);

      const find = async (u: string) => {
        const { data, error } = await supabase
          .from("users")
          .select("name, username, expiration_date, user_type")
          .eq("username", u)
          .limit(1);
        if (error) throw new Error("Database error: " + error.message);
        return data?.[0];
      };

      // Exact stored casing first, then lowercase fallback
      let u = await find(email);
      if (!u) u = await find(email.toLowerCase());
      if (!u) return json({ error: "No account found for that email" }, 404);

      return json({
        success: true,
        customer: {
          name: u.name,
          username: u.username,
          expiration_date: u.expiration_date,
          user_type: u.user_type,
        },
      });
    }

    // ---- EXTEND: spend credits and bump the account expiry atomically ----
    if (action === "extend") {
      const reseller = await verifyReseller();
      const email = String(body?.email ?? "").trim();
      const plan = String(body?.plan ?? "");
      if (!email) return json({ error: "Email is required" }, 400);

      const planDef = PLANS[plan];
      if (!planDef) return json({ error: "Unknown plan" }, 400);

      const { data, error } = await supabase.rpc("extend_reseller_expiry", {
        p_reseller_id: reseller.id,
        p_email: email,
        p_days: planDef.days,
        p_cost: planDef.cost,
        p_reason: `Extended ${planDef.label} by reseller ${reseller.username}`,
      });
      if (error) return json({ error: error.message }, 400);

      const row = Array.isArray(data) ? data[0] : data;
      return json({
        success: true,
        newExpirationDate: row?.new_expiration ?? null,
        credits: row?.credits_left ?? reseller.credits,
      });
    }

    // ---- CREATE SUB-RESELLER: full resellers mint sub accounts (parents only) ----
    if (action === "create_sub") {
      const parent = await verifyReseller();
      if (parent.user_type !== "reseller") {
        return json({ error: "Only resellers can create sub-resellers" }, 403);
      }
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

      // Sub-resellers are portal logins like resellers — far-future expiry
      // keeps them out of the "expired" filters.
      const farFuture = new Date("2099-01-01T00:00:00Z").toISOString();

      const { data: created, error: insertError } = await supabase
        .from("users")
        .insert({
          username: email,
          password,
          name,
          whatsapp_number: whatsapp,
          user_type: "sub_reseller",
          credits: 0,
          expiration_date: farFuture,
          created_by: parent.id,
        })
        .select("id, username, name, whatsapp_number, credits")
        .single();
      if (insertError) {
        return json({ error: "Failed to create sub-reseller: " + insertError.message }, 500);
      }

      return json({ success: true, subReseller: created });
    }

    // ---- LIST SUB-RESELLERS owned by this reseller (parents only) ----
    if (action === "list_subs") {
      const parent = await verifyReseller();
      if (parent.user_type !== "reseller") {
        return json({ error: "Only resellers can view sub-resellers" }, 403);
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, username, name, whatsapp_number, credits, created_at")
        .eq("user_type", "sub_reseller")
        .eq("created_by", parent.id)
        .order("created_at", { ascending: true });
      if (error) throw new Error("Database error: " + error.message);

      return json({ success: true, subs: data ?? [] });
    }

    // ---- TRANSFER CREDITS from this reseller to one of their sub-resellers ----
    if (action === "transfer_credits") {
      const parent = await verifyReseller();
      if (parent.user_type !== "reseller") {
        return json({ error: "Only resellers can send credits" }, 403);
      }
      const subId = String(body?.subId ?? "");
      const amount = Number(body?.amount);
      const note = String(body?.note ?? "").trim() || null;
      if (!subId) return json({ error: "Sub-reseller is required" }, 400);
      if (!Number.isFinite(amount) || amount <= 0) {
        return json({ error: "Enter a positive number of credits" }, 400);
      }

      const { data, error } = await supabase.rpc("transfer_reseller_credits", {
        p_from_reseller_id: parent.id,
        p_to_sub_reseller_id: subId,
        p_amount: Math.round(amount),
        p_reason: note,
      });
      if (error) return json({ error: error.message }, 400);

      const row = Array.isArray(data) ? data[0] : data;
      return json({
        success: true,
        senderCredits: row?.sender_balance ?? null,
        receiverCredits: row?.receiver_balance ?? null,
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[reseller-portal] error:", message);
    return json({ error: message }, 400);
  }
});
