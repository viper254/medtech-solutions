-- ============================================================
-- 005_fix_function_search_paths.sql
-- Fixes "Function Search Path Mutable" security warnings by
-- setting search_path = public on all SECURITY DEFINER functions
-- ============================================================

CREATE OR REPLACE FUNCTION get_admins()
RETURNS TABLE (user_id uuid, email text, is_super_admin boolean, added_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, email, is_super_admin, added_at
  FROM admins
  ORDER BY added_at ASC;
$$;

CREATE OR REPLACE FUNCTION add_admin_by_email(target_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_uid uuid;
  caller_is_super boolean;
BEGIN
  SELECT is_super_admin INTO caller_is_super
  FROM admins WHERE user_id = auth.uid();

  IF NOT FOUND OR NOT caller_is_super THEN
    RETURN json_build_object('error', 'Not authorized');
  END IF;

  SELECT id INTO target_uid
  FROM auth.users WHERE email = target_email LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'No user found with that email. They must sign up first.');
  END IF;

  INSERT INTO admins (user_id, email, is_super_admin)
  VALUES (target_uid, target_email, false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN json_build_object('success', true, 'user_id', target_uid);
END;
$$;

CREATE OR REPLACE FUNCTION remove_admin(target_uid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION bootstrap_super_admin(user_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM admins;

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
