-- ============================================================
-- BizDoc AI — Full Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- users_profile (extends auth.users)
CREATE TABLE users_profile (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  locale text DEFAULT 'zh',
  plan text DEFAULT 'free',         -- free | pro | business
  quota_monthly int DEFAULT 5,
  quota_used int DEFAULT 0,
  quota_reset_at timestamptz DEFAULT (now() + interval '1 month'),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_profile" ON users_profile
  FOR ALL USING (auth.uid() = id);

-- company_profiles (one per user, used for auto-fill in tools)
CREATE TABLE company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text,
  contact_name text,
  email text,
  phone text,
  address text,
  payment_terms text,
  currency text DEFAULT 'USD',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_company" ON company_profiles
  FOR ALL USING (auth.uid() = user_id);

-- clients (mini client book)
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  company text,
  phone text,
  notes text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_clients_user_id ON clients(user_id);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_clients" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- generations (AI output history)
CREATE TABLE generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_type text NOT NULL,          -- quote | invoice | email
  locale text,
  status text DEFAULT 'completed',  -- generating | completed | failed
  input_data jsonb,
  output_data jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_generations_user_created ON generations(user_id, created_at DESC);
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_generations" ON generations
  FOR ALL USING (auth.uid() = user_id);

-- admin_logs (audit trail for admin actions)
CREATE TABLE admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id),
  target_user_id uuid REFERENCES auth.users(id),
  action text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- Trigger: auto-create users_profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users_profile (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- RPC: atomic quota consume (reset if expired → check → decrement in one tx)
-- Uses auth.uid() internally — no caller-supplied user id accepted.
-- Returns jsonb: { ok, used, monthly, remaining } or { ok:false, error }.
-- ============================================================
CREATE OR REPLACE FUNCTION consume_quota()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_monthly  int;
  v_used     int;
  v_reset_at timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  SELECT quota_monthly, quota_used, quota_reset_at
  INTO   v_monthly, v_used, v_reset_at
  FROM   users_profile
  WHERE  id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'profile_not_found');
  END IF;

  -- Lazy reset: if the monthly window has passed, restart the counter
  IF v_reset_at <= now() THEN
    v_used := 0;
    UPDATE users_profile
    SET    quota_used = 0,
           quota_reset_at = now() + interval '1 month'
    WHERE  id = v_uid;
  END IF;

  IF v_used >= v_monthly THEN
    RETURN jsonb_build_object(
      'ok',        false,
      'error',     'quota_exceeded',
      'used',      v_used,
      'monthly',   v_monthly,
      'remaining', 0
    );
  END IF;

  UPDATE users_profile
  SET    quota_used = v_used + 1
  WHERE  id = v_uid;

  RETURN jsonb_build_object(
    'ok',        true,
    'used',      v_used + 1,
    'monthly',   v_monthly,
    'remaining', v_monthly - v_used - 1
  );
END;
$$;
