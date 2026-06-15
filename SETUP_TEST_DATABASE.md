# 🚀 Setup Test Database - Complete Guide

## Step 1: Run Base Schema (Migrations 001-011)

1. Go to: https://supabase.com/dashboard
2. Open your test project: **citezcikptfwwgexwxhh**
3. Click **SQL Editor** → **New Query**
4. Copy the ENTIRE contents of: `supabase/migrations/000_combined_base_schema.sql`
5. Paste and click **Run**
6. Wait for "Success" (~5-10 seconds)

## Step 2: Run Developer Control System (Migration 012)

1. In the same SQL Editor, click **New Query**
2. Copy the ENTIRE contents of: `supabase/migrations/012_developer_control_system.sql`
3. Paste and click **Run**
4. Wait for "Success" (~2-3 seconds)

## Step 3: Fix RLS Policies

1. Click **New Query** again
2. Copy and paste this:

```sql
-- Fix RLS policies to allow anonymous access for control panel
DROP POLICY IF EXISTS "Allow authenticated access to site_control" ON site_control;
DROP POLICY IF EXISTS "Allow authenticated access to payment_history" ON payment_history;

CREATE POLICY "Allow anon access to site_control" 
ON site_control 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow anon access to payment_history" 
ON payment_history 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);
```

3. Click **Run**
4. Wait for "Success"

## Step 4: Verify Everything

Run this verification query:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check site_control has data
SELECT * FROM site_control;

-- Test the status function
SELECT * FROM get_site_status();
```

You should see:
- ✅ All tables listed (products, orders, site_control, payment_history, etc.)
- ✅ One row in site_control with is_active = true
- ✅ Status function returns data

## Step 5: Test Control Panel

1. Make sure dev server is running: `npm run dev`
2. Visit: `http://localhost:5174/dev/control?key=phantom@2025`
3. You should see the control panel! 🎉

## ✅ Success Checklist

- [ ] Base schema applied (000_combined_base_schema.sql)
- [ ] Developer control system applied (012_developer_control_system.sql)
- [ ] RLS policies fixed
- [ ] Verification queries passed
- [ ] Control panel loads successfully

## 🆘 If Something Goes Wrong

### Start Fresh

If you need to start over:

```sql
-- Drop all tables (CAREFUL!)
DROP TABLE IF EXISTS repair_service_media CASCADE;
DROP TABLE IF EXISTS customer_profiles CASCADE;
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_media CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS repair_services CASCADE;
DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS site_control CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_site_status();
DROP FUNCTION IF EXISTS check_auto_disable();
DROP FUNCTION IF EXISTS get_admins();
DROP FUNCTION IF EXISTS add_admin_by_email(text);
DROP FUNCTION IF EXISTS remove_admin(uuid);
DROP FUNCTION IF EXISTS bootstrap_super_admin(text);
DROP FUNCTION IF EXISTS update_orders_updated_at();
DROP FUNCTION IF EXISTS handle_new_customer();
```

Then run all 3 steps again.

---

**Ready?** Start with Step 1! 🚀
