-- ============================================================
-- MIGRATION: Phase 0 security - system_config hardening
-- Description:
--   1. Removes the OpenAI API key from the database. The key now
--      lives only as the OPENAI_API_KEY secret of the ai-proxy
--      Edge Function.
--   2. Restricts system_config to superadmins (profiles.is_admin)
--      with explicit per-command policies and WITH CHECK clauses.
-- ============================================================

-- 1. Remove stored OpenAI key
DELETE FROM system_config WHERE config_key = 'openai_api_key';

-- 2. Tighten RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Drop previous / potentially permissive policies
DROP POLICY IF EXISTS system_config_superadmin_all ON system_config;
DROP POLICY IF EXISTS system_config_select ON system_config;
DROP POLICY IF EXISTS system_config_insert ON system_config;
DROP POLICY IF EXISTS system_config_update ON system_config;
DROP POLICY IF EXISTS system_config_delete ON system_config;
DROP POLICY IF EXISTS "Enable read access for all users" ON system_config;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON system_config;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON system_config;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON system_config;
DROP POLICY IF EXISTS "Allow authenticated read" ON system_config;
DROP POLICY IF EXISTS "Allow authenticated write" ON system_config;

-- Superadmin = profiles.is_admin = true (same rule as existing policies)
CREATE POLICY system_config_superadmin_select ON system_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY system_config_superadmin_insert ON system_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY system_config_superadmin_update ON system_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY system_config_superadmin_delete ON system_config
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.is_admin = true
    )
  );

-- No access for anonymous role
REVOKE ALL ON system_config FROM anon;

COMMENT ON TABLE system_config IS 'System settings (superadmin only). Secrets must NOT be stored here; use Edge Function secrets.';
