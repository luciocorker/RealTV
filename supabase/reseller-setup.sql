-- ============================================================
-- RealTV — Reseller credit system setup
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL).
-- ============================================================

-- 1. New columns on users -------------------------------------------------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS users_created_by_idx ON public.users (created_by);

-- 1b. Allow the 'reseller' user_type (existing CHECK only allows standard/premium/admin)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE public.users ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('standard', 'premium', 'admin', 'reseller'));

-- 2. Audit trail for every credit change ----------------------------------
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES public.users(id),
  change INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT,
  performed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Atomic reseller extension (spend credits + bump expiry in ONE
--    transaction, row-level locks prevent double-spending) -----------------
CREATE OR REPLACE FUNCTION public.extend_reseller_expiry(
  p_reseller_id UUID,
  p_email TEXT,
  p_days INTEGER,
  p_cost INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (new_expiration TIMESTAMPTZ, credits_left INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
  v_target_id UUID;
  v_target_type TEXT;
  v_current_expiration TIMESTAMPTZ;
  v_new_expiration TIMESTAMPTZ;
BEGIN
  IF p_days IS NULL OR p_days <= 0 THEN
    RAISE EXCEPTION 'Invalid extension duration';
  END IF;
  IF p_cost IS NULL OR p_cost <= 0 THEN
    RAISE EXCEPTION 'Invalid credit cost';
  END IF;

  -- Lock the reseller row and check the balance
  SELECT credits INTO v_balance
  FROM public.users
  WHERE id = p_reseller_id AND user_type = 'reseller'
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Reseller account not found';
  END IF;
  IF v_balance < p_cost THEN
    RAISE EXCEPTION 'Insufficient credits (balance %, needed %)', v_balance, p_cost;
  END IF;

  -- Lock the target account (exact match first — the site stores usernames
  -- with the casing the account was created with — then lowercase fallback)
  SELECT id, user_type, expiration_date::timestamptz
    INTO v_target_id, v_target_type, v_current_expiration
  FROM public.users
  WHERE username = p_email OR username = lower(p_email)
  ORDER BY (username = p_email) DESC
  LIMIT 1
  FOR UPDATE;

  IF v_target_id IS NULL THEN
    RAISE EXCEPTION 'No account found for %', p_email;
  END IF;
  IF v_target_type = 'admin' THEN
    RAISE EXCEPTION 'Admin accounts cannot be extended';
  END IF;

  -- Stacked expiry: from the current expiry if still active, otherwise from now
  v_new_expiration := GREATEST(COALESCE(v_current_expiration, now()), now())
                      + (p_days || ' days')::interval;

  UPDATE public.users
  SET expiration_date = v_new_expiration,
      mobile_expiration_date = v_new_expiration
  WHERE id = v_target_id;

  UPDATE public.users
  SET credits = credits - p_cost
  WHERE id = p_reseller_id;

  v_balance := v_balance - p_cost;

  INSERT INTO public.credit_transactions (reseller_id, change, balance_after, reason, performed_by)
  VALUES (p_reseller_id, -p_cost, v_balance, p_reason, p_reseller_id);

  RETURN QUERY SELECT v_new_expiration, v_balance;
END;
$$;

-- 4. Admin credit grants/deductions (also logged) --------------------------
CREATE OR REPLACE FUNCTION public.grant_credits(
  p_reseller_id UUID,
  p_amount INTEGER,
  p_note TEXT DEFAULT NULL,
  p_performed_by UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  IF p_amount IS NULL OR p_amount = 0 THEN
    RAISE EXCEPTION 'Credit amount cannot be zero';
  END IF;

  SELECT credits INTO v_balance
  FROM public.users
  WHERE id = p_reseller_id AND user_type = 'reseller'
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Reseller account not found';
  END IF;
  IF v_balance + p_amount < 0 THEN
    RAISE EXCEPTION 'Adjustment would make credits negative (balance %, change %)', v_balance, p_amount;
  END IF;

  UPDATE public.users
  SET credits = credits + p_amount
  WHERE id = p_reseller_id;

  v_balance := v_balance + p_amount;

  INSERT INTO public.credit_transactions (reseller_id, change, balance_after, reason, performed_by)
  VALUES (p_reseller_id, p_amount, v_balance, p_note, p_performed_by);

  RETURN v_balance;
END;
$$;

-- 5. Lock the functions down to the service role only ----------------------
--    (they are called from Edge Functions, which use SUPABASE_SERVICE_ROLE_KEY)
REVOKE EXECUTE ON FUNCTION public.extend_reseller_expiry(UUID, TEXT, INTEGER, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.extend_reseller_expiry(UUID, TEXT, INTEGER, INTEGER, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.grant_credits(UUID, INTEGER, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_credits(UUID, INTEGER, TEXT, UUID) TO service_role;