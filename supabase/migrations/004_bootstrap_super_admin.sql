-- ============================================================
-- 004_bootstrap_super_admin.sql
-- RPC that auto-promotes the first user to super admin
-- if the admins table is empty. Safe to call on every login.
-- ============================================================

CREATE OR REPLACE FUNCTION bootstrap_super_admin(user_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_count integer;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM admins;

  -- Only bootstrap if no admins exist yet
  IF admin_count = 0 THEN
    INSERT INTO admins (user_id, email, is_super_admin)
    VALUES (auth.uid(), user_email, true)
    ON CONFLICT (user_id) DO UPDATE
      SET is_super_admin = true,
          email = EXCLUDED.email;

    RETURN json_build_object('bootstrapped', true);
  END IF;

  RETURN json_build_object('bootstrapped', false);
END;
$$;
