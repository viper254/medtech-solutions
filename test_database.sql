-- Run these queries in Supabase SQL Editor to verify everything is set up

-- 1. Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('site_control', 'payment_history');

-- 2. Check site_control data
SELECT * FROM site_control;

-- 3. Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_site_status', 'check_auto_disable');

-- 4. Test get_site_status function
SELECT * FROM get_site_status();

-- 5. Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('site_control', 'payment_history');
