# Testing Kill Switch System Locally

## 🎯 Goal
Test the kill switch system in a safe test environment without affecting production.

## 📋 Prerequisites

- [ ] Create a new Supabase project for testing
- [ ] Have test data ready (or copy from production)
- [ ] Local dev server running

## Step 1: Create Test Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Settings:
   - Name: `medtech-test`
   - Database Password: (save this!)
   - Region: Same as production
4. Wait for project to be created (~2 minutes)

## Step 2: Get Test Project Credentials

1. In your test project, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGci...` (long key)

## Step 3: Configure Local Test Environment

1. Open `.env.local` file
2. Replace the placeholders:
   ```env
   VITE_SUPABASE_URL=https://your-test-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-test-anon-key-here
   VITE_DEV_CONTROL_KEY=test_control_key_2024
   ```

3. Save the file

## Step 4: Set Up Test Database

### Option A: Copy Production Schema (Recommended)

1. In **production** Supabase, go to **SQL Editor**
2. Run this to export schema:
   ```sql
   -- This will show you all your table definitions
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

3. Copy your existing migrations to test project
4. In **test** Supabase SQL Editor, run all migrations in order:
   - `001_initial_schema.sql`
   - `002_add_medical_equipment_category.sql`
   - ... (all your existing migrations)

### Option B: Fresh Start (Simpler)

Just run the essential migrations you need for testing.

## Step 5: Add Test Data

In test Supabase SQL Editor, add some sample data:

```sql
-- Create a test admin user (use your email)
INSERT INTO admins (user_id, email, role, is_super_admin)
VALUES (
  'test-user-id',
  'your-email@example.com',
  'super_admin',
  true
);

-- Add a test product
INSERT INTO products (name, category, description, original_price, stock_quantity)
VALUES (
  'Test Product',
  'Phones',
  'This is a test product',
  10000,
  5
);
```

## Step 6: Run Local Dev Server with Test Environment

```bash
# Stop current dev server (Ctrl+C)

# Start with test environment
npm run dev

# The .env.local file will automatically be used
```

## Step 7: Apply Kill Switch Migration to Test DB

1. In **test** Supabase SQL Editor
2. Copy contents of `supabase/migrations/012_developer_control_system_fixed.sql`
3. Paste and run
4. Verify tables created:
   ```sql
   SELECT * FROM site_control;
   SELECT * FROM payment_history;
   ```

## Step 8: Test the Kill Switch

### Test 1: Access Control Panel
1. Visit: `http://localhost:5173/dev/control?key=test_control_key_2024`
2. Should see the control panel ✅

### Test 2: Disable Site
1. In control panel, click **"Disable Site Now"**
2. Visit homepage: `http://localhost:5173`
3. Should see "Store Temporarily Unavailable" page ✅

### Test 3: Enable Site
1. Go back to control panel
2. Click **"Enable Site Now"**
3. Visit homepage
4. Should see normal site ✅

### Test 4: Record Payment
1. In control panel, go to "Record Payment"
2. Enter amount: 5000
3. Notes: "Test payment"
4. Click "Record Payment & Extend 30 Days"
5. Check payment history appears ✅

### Test 5: Auto-Disable
1. In control panel, set:
   - Payment Due Date: Tomorrow
   - Grace Period: 0 days
   - Enable "Auto-Disable on Overdue"
2. Save settings
3. Manually change due date in database to yesterday:
   ```sql
   UPDATE site_control 
   SET payment_due_date = NOW() - INTERVAL '1 day';
   ```
4. Refresh homepage
5. Should auto-disable ✅

### Test 6: Admin Warning Banner
1. Set payment due date to 5 days from now
2. Enable site
3. Login as admin
4. Should see payment warning banner ✅

## Step 9: Verify Everything Works

- [ ] Control panel accessible with secret key
- [ ] Site disables/enables correctly
- [ ] Payment recording works
- [ ] Payment history displays
- [ ] Auto-disable works
- [ ] Admin sees warning banners
- [ ] Customers see appropriate messages
- [ ] Regular site features still work when enabled

## Step 10: Switch Back to Production

When testing is complete:

```bash
# Stop dev server (Ctrl+C)

# Rename .env.local to disable it
mv .env.local .env.local.backup

# Or delete it
rm .env.local

# Start dev server (will use .env)
npm run dev
```

Now you're back to production environment!

## 🚀 Deploy to Production (Only After Testing)

Once everything works in test:

1. **Backup production database** (Supabase Dashboard → Database → Backups)
2. **Apply migration** to production Supabase
3. **Update production .env** with control key
4. **Deploy** to Vercel/Netlify
5. **Test** on production URL
6. **Bookmark** production control panel URL

## 🆘 Rollback Plan

If something goes wrong in production:

1. Run rollback migration:
   ```sql
   -- In production Supabase SQL Editor
   DROP FUNCTION IF EXISTS get_site_status();
   DROP FUNCTION IF EXISTS check_auto_disable();
   DROP TABLE IF EXISTS payment_history CASCADE;
   DROP TABLE IF EXISTS site_control CASCADE;
   ```

2. Redeploy previous version without kill switch code

## 📝 Notes

- `.env.local` takes priority over `.env`
- Test environment is completely separate from production
- No risk to production data or users
- Can test as many times as needed
- Delete test project when done to save resources

## ✅ Checklist Before Production

- [ ] All tests passed in test environment
- [ ] Control panel works perfectly
- [ ] Site disable/enable works
- [ ] Payment tracking works
- [ ] Auto-disable works as expected
- [ ] No errors in browser console
- [ ] No errors in Supabase logs
- [ ] Backup of production database taken
- [ ] Rollback plan ready
- [ ] Team notified of deployment

---

**Remember**: Test thoroughly before touching production!
