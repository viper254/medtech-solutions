-- Test if basic queries work

-- 1. Simple query - should work instantly
SELECT NOW() as current_time;

-- 2. Check if site_control exists and can be queried
SELECT COUNT(*) FROM site_control;

-- 3. Try to select from site_control
SELECT * FROM site_control;

-- 4. Check RLS policies on site_control
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'site_control';

-- 5. Test the function directly (this might hang)
SELECT * FROM get_site_status();
