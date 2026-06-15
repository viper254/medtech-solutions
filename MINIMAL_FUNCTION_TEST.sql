-- Create a minimal test version of get_site_status that just returns hardcoded data
-- This will help us determine if the issue is with the function logic or something else

DROP FUNCTION IF EXISTS get_site_status();

-- Super simple version - just returns hardcoded data
CREATE OR REPLACE FUNCTION get_site_status()
RETURNS TABLE (
  is_active BOOLEAN,
  customer_message TEXT,
  admin_message TEXT,
  days_until_due INTEGER,
  is_overdue BOOLEAN
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT true, 'Test message'::TEXT, 'Admin test'::TEXT, 30, false;
$$;

GRANT EXECUTE ON FUNCTION get_site_status() TO anon, authenticated;

-- Test it
SELECT * FROM get_site_status();
