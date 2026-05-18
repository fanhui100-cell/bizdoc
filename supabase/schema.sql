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
  logo_url text,                   -- public URL from Supabase Storage
  -- Migration: ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS logo_url text;
  company_name text,
  contact_name text,
  email text,
  phone text,
  address text,
  payment_terms text,
  bank_info text,
  pdf_style text DEFAULT 'minimal' CHECK (pdf_style IN ('minimal', 'business', 'colorful')),
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
  portal_token uuid DEFAULT gen_random_uuid(),
  portal_expires_at timestamptz DEFAULT (now() + interval '90 days'),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE UNIQUE INDEX idx_clients_portal_token ON clients(portal_token);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_clients" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- generations (AI output history)
CREATE TABLE generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  parent_id uuid REFERENCES generations(id) ON DELETE SET NULL,
  tool_type text NOT NULL,                    -- quote | invoice | email
  locale text,
  status text DEFAULT 'completed',            -- generating | completed | failed
  invoice_status text DEFAULT 'pending',      -- pending | reminded | paid | overdue | cancelled (invoices only)
  accepted_at timestamptz,
  acceptor_name text,
  acceptor_email text,
  input_data jsonb,
  output_data jsonb,
  created_at timestamptz DEFAULT now()
);
-- Migrations for existing databases (run once if schema already applied):
-- ALTER TABLE generations ADD COLUMN IF NOT EXISTS invoice_status text DEFAULT 'pending';
-- ALTER TABLE generations ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES generations(id);
-- ALTER TABLE generations ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
-- ALTER TABLE generations ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
-- ALTER TABLE generations ADD COLUMN IF NOT EXISTS acceptor_name text;
-- ALTER TABLE generations ADD COLUMN IF NOT EXISTS acceptor_email text;
CREATE INDEX idx_generations_user_created ON generations(user_id, created_at DESC);
CREATE INDEX idx_generations_client_created ON generations(client_id, created_at DESC);
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_generations" ON generations
  FOR ALL USING (auth.uid() = user_id);

-- user_templates (named form presets per tool)
CREATE TABLE IF NOT EXISTS user_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_type text NOT NULL,   -- quote | invoice | email
  name text NOT NULL,
  input_data jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_user_templates_user_tool ON user_templates(user_id, tool_type);
ALTER TABLE user_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_templates" ON user_templates
  FOR ALL USING (auth.uid() = user_id);

-- api_keys (Business plan API access)
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text DEFAULT 'Default',
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  revoked boolean DEFAULT false,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_api_keys_user_created ON api_keys(user_id, created_at DESC);
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_api_keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

-- document_events (public views/downloads/acceptances audit)
CREATE TABLE IF NOT EXISTS document_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid REFERENCES generations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('view', 'pdf_download', 'quote_accepted', 'invoice_due_reminder', 'invoice_overdue_reminder', 'quote_expiry_reminder')),
  actor_email text,
  actor_name text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_document_events_generation_created ON document_events(generation_id, created_at DESC);
CREATE INDEX idx_document_events_user_created ON document_events(user_id, created_at DESC);

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

-- Client portal tokens (run once)
-- ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_token uuid DEFAULT gen_random_uuid();
-- ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_expires_at timestamptz DEFAULT (now() + interval '90 days');
-- UPDATE clients SET portal_token = gen_random_uuid() WHERE portal_token IS NULL;
-- UPDATE clients SET portal_expires_at = now() + interval '90 days' WHERE portal_expires_at IS NULL;
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_portal_token ON clients(portal_token);

-- Company profile PDF customization (run once)
-- ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS bank_info text;
-- ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS pdf_style text DEFAULT 'minimal';
