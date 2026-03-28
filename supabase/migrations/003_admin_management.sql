-- ============================================================
-- 003_admin_management.sql
-- Adds super_admin flag and RPC helpers for admin management
-- ============================================================

-- Add super_admin column — only super admins can manage other admins
ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS added_at timestamptz NOT NULL DEFAULT now();

-- ── RPC: get_admins ───────────────────────────────────────────
-- Returns all rows from admins table (only callable by admins)
CREATE OR REPLACE FUNCTION get_admins()
RETURNS TABLE (user_id uuid, email text, is_super_admin boolean, added_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT user_id, email, is_super_admin, added_at
  FROM admins
  ORDER BY added_at ASC;
$$;

-- ── RPC: add_admin_by_email ───────────────────────────────────
-- Looks up a user by email in auth.users and inserts into admins.
-- Only callable by super admins.
CREATE OR REPLACE FUNCTION add_admin_by_email(target_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_uid uuid;
  caller_is_super boolean;
BEGIN
  -- Check caller is a super admin
  SELECT is_super_admin INTO caller_is_super
  FROM admins WHERE user_id = auth.uid();

  IF NOT FOUND OR NOT caller_is_super THEN
    RETURN json_build_object('error', 'Not authorized');
  END IF;

  -- Look up the user by email
  SELECT id INTO target_uid
  FROM auth.users WHERE email = target_email LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'No user found with that email. They must sign up first.');
  END IF;

  -- Insert (ignore if already admin)
  INSERT INTO admins (user_id, email, is_super_admin)
  VALUES (target_uid, target_email, false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN json_build_object('success', true, 'user_id', target_uid);
END;
$$;

-- ── RPC: remove_admin ─────────────────────────────────────────
-- Removes an admin by user_id. Super admins only. Cannot remove yourself.
CREATE OR REPLACE FUNCTION remove_admin(target_uid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_is_super boolean;
BEGIN
  SELECT is_super_admin INTO caller_is_super
  FROM admins WHERE user_id = auth.uid();

  IF NOT FOUND OR NOT caller_is_super THEN
    RETURN json_build_object('error', 'Not authorized');
  END IF;

  IF target_uid = auth.uid() THEN
    RETURN json_build_object('error', 'You cannot remove yourself.');
  END IF;

  DELETE FROM admins WHERE user_id = target_uid AND is_super_admin = false;

  RETURN json_build_object('success', true);
END;
$$;
