-- Rollback Developer Control System
-- This removes all tables, functions, and policies created by the control system

-- Drop functions first (they depend on tables)
DROP FUNCTION IF EXISTS get_site_status();
DROP FUNCTION IF EXISTS check_auto_disable();

-- Drop policies
DROP POLICY IF EXISTS "No direct access to site_control" ON site_control;
DROP POLICY IF EXISTS "No direct access to payment_history" ON payment_history;

-- Drop tables
DROP TABLE IF EXISTS payment_history;
DROP TABLE IF EXISTS site_control;

-- Clean up any grants (just to be safe)
-- No need to revoke since functions are dropped

-- Verification comment
COMMENT ON SCHEMA public IS 'Developer control system has been rolled back';
