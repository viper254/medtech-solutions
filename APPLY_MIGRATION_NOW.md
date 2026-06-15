# 🚀 Apply Migration to Test Database - Step by Step

## Your Test Supabase Project

**URL**: https://citezcikptfwwgexwxhh.supabase.co

## Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Click on your test project: **citezcikptfwwgexwxhh**
3. In the left sidebar, click **SQL Editor**
4. Click **New Query**

## Step 2: Copy the Migration SQL

Open the file: `supabase/migrations/012_developer_control_system.sql`

Copy the ENTIRE contents of that file.

## Step 3: Paste and Run

1. Paste the SQL into the Supabase SQL Editor
2. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
3. Wait for it to complete (~2-3 seconds)

## Step 4: Verify Tables Created

Run this query to verify:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('site_control', 'payment_history');

-- Check site_control data
SELECT * FROM site_control;

-- Check payment_history (should be empty)
SELECT * FROM payment_history;
```

You should see:
- ✅ Both tables listed
- ✅ One row in `site_control` with `is_active = true`
- ✅ Empty `payment_history` table

## Step 5: Test the Functions

```sql
-- Test get_site_status function
SELECT * FROM get_site_status();
```

You should see:
- `is_active`: true
- `customer_message`: "Our store is temporarily unavailable..."
- `admin_message`: "Payment is overdue..."
- `days_until_due`: ~30 (approximately 30 days)
- `is_overdue`: false

## ✅ Success!

If all the above works, your database is ready!

## 🎯 Next Step: Start Dev Server

```bash
npm run dev
```

Then access the control panel:
```
http://localhost:5173/dev/control?key=phantom@2025
```

## 🆘 If You Get Errors

### Error: "relation already exists"
This means tables already exist. Drop them first:
```sql
DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS site_control CASCADE;
DROP FUNCTION IF EXISTS get_site_status();
DROP FUNCTION IF EXISTS check_auto_disable();
```

Then run the migration again.

### Error: "permission denied"
Make sure you're logged into the correct Supabase project.

### Error: "syntax error"
Make sure you copied the ENTIRE migration file, including all the `$$` delimiters.

---

**Ready?** Go apply the migration now! 🚀
