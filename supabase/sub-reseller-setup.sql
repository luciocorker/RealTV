-- ============================================================
-- RealTV — Sub-reseller support
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL).
--
-- Sub-resellers are reseller accounts created by a parent
-- reseller from the Reseller Portal. They:
--   • CAN extend customer subscriptions (spending their credits)
--   • CANNOT top up on their own — only their parent reseller
--     can send them credits (from the parent's own balance)
-- ============================================================

-- 1. Allow the 'sub_reseller' user_type ------------------------------------
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE public.users ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('standard', 'premium', 'admin', 'reseller', 'sub_reseller'));

-- 2. Extend: sub-resellers may only extend customer subscriptions -----------
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
  v_spender_type TEXT;
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

  -- Lock the spender row and check the balance (resellers AND sub-resellers)
  SELECT credits, user_type INTO v_balance, v_spender_type
  FROM public.users
  WHERE id = p_reseller_id AND user_type IN ('reseller', 'sub_reseller')
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

  -- Sub-resellers can only extend standard/premium customer subscriptions
  IF v_spender_type = 'sub_reseller' AND v_target_type NOT IN ('standard', 'premium') THEN
    RAISE EXCEPTION 'Sub-resellers can only extend customer subscriptions';
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

-- 3. Admin grants apply to resellers AND sub-resellers ----------------------
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
  WHERE id = p_reseller_id AND user_type IN ('reseller', 'sub_reseller')
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

-- 4. Parent → sub-reseller credit transfer (atomic, logged) -----------------
CREATE OR REPLACE FUNCTION public.transfer_reseller_credits(
  p_from_reseller_id UUID,
  p_to_sub_reseller_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (sender_balance INTEGER, receiver_balance INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_balance INTEGER;
  v_receiver_balance INTEGER;
  v_reason TEXT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Transfer amount must be a positive number of credits';
  END IF;

  v_reason := COALESCE(NULLIF(btrim(p_reason), ''), 'Credit transfer');

  -- Lock the sender row (must be a full reseller)
  SELECT credits INTO v_sender_balance
  FROM public.users
  WHERE id = p_from_reseller_id AND user_type = 'reseller'
  FOR UPDATE;

  IF v_sender_balance IS NULL THEN
    RAISE EXCEPTION 'Reseller account not found';
  END IF;
  IF v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits (balance %, needed %)', v_sender_balance, p_amount;
  END IF;

  -- Lock the receiver row (must be a sub-reseller created by the sender)
  SELECT credits INTO v_receiver_balance
  FROM public.users
  WHERE id = p_to_sub_reseller_id
    AND user_type = 'sub_reseller'
    AND created_by = p_from_reseller_id
  FOR UPDATE;

  IF v_receiver_balance IS NULL THEN
    RAISE EXCEPTION 'Sub-reseller account not found (it must be one of your own sub-resellers)';
  END IF;

  UPDATE public.users
  SET credits = credits - p_amount
  WHERE id = p_from_reseller_id;

  UPDATE public.users
  SET credits = credits + p_amount
  WHERE id = p_to_sub_reseller_id;

  v_sender_balance := v_sender_balance - p_amount;
  v_receiver_balance := v_receiver_balance + p_amount;

  INSERT INTO public.credit_transactions (reseller_id, change, balance_after, reason, performed_by)
  VALUES
    (p_from_reseller_id, -p_amount, v_sender_balance, v_reason || ' — sent to sub-reseller', p_from_reseller_id),
    (p_to_sub_reseller_id,  p_amount, v_receiver_balance, v_reason || ' — received from reseller', p_from_reseller_id);

  RETURN QUERY SELECT v_sender_balance, v_receiver_balance;
END;
$$;

-- 5. Lock the functions down to the service role only -----------------------
--    (they are called from Edge Functions, which use SUPABASE_SERVICE_ROLE_KEY)
REVOKE EXECUTE ON FUNCTION public.extend_reseller_expiry(UUID, TEXT, INTEGER, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.extend_reseller_expiry(UUID, TEXT, INTEGER, INTEGER, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.grant_credits(UUID, INTEGER, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_credits(UUID, INTEGER, TEXT, UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION public.transfer_reseller_credits(UUID, UUID, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_reseller_credits(UUID, UUID, INTEGER, TEXT) TO service_role;