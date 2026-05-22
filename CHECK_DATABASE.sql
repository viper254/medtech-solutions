-- Check what exists in your test database

-- 1. List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. List all functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- 3. Check if site_control exists and has data
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'site_control'
) as site_control_exists;

-- 4. If site_control exists, show its data
SELECT * FROM site_control;

-- 5. Check if get_site_status function exists
SELECT EXISTS (
  SELECT FROM information_schema.routines 
  WHERE routine_schema = 'public' 
  AND routine_name = 'get_site_status'
) as function_exists;
