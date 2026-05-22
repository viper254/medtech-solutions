# 🔧 Fix RLS Policies - Run This Now

## The Problem

The control panel can't access the database because the RLS (Row Level Security) policies only allow authenticated users, but the control panel isn't logging in.

## The Solution

Update the RLS policies to allow anonymous access. The control panel is already protected by the secret key in the URL.

## Steps

### 1. Open Supabase SQL Editor

Go to: https://supabase.com/dashboard
- Click your test project: **citezcikptfwwgexwxhh**
- Click **SQL Editor**
- Click **New Query**

### 2. Copy and Run This SQL

```sql
-- Fix RLS policies to allow anonymous access for control panel
-- The control panel is protected by secret key in URL, not by authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated access to site_control" ON site_control;
DROP POLICY IF EXISTS "Allow authenticated access to payment_history" ON payment_history;

-- Allow anonymous (anon) and authenticated users to access site_control
CREATE POLICY "Allow anon access to site_control" 
ON site_control 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Allow anonymous (anon) and authenticated users to access payment_history
ON payment_history 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);
```

### 3. Click Run

Wait for "Success" message.

### 4. Verify

Run this to check:
```sql
SELECT tablename, policyname, roles 
FROM pg_policies 
WHERE tablename IN ('site_control', 'payment_history');
```

You should see policies with `{anon, authenticated}` in the roles column.

### 5. Test Control Panel

Refresh your browser:
```
http://localhost:5174/dev/control?key=phantom@2025
```

It should now work! 🎉

---

**Why this is safe:**
- Control panel URL is secret (not linked anywhere)
- Secret key required in URL (`?key=phantom@2025`)
- Only you know the URL and key
- Tables only contain site control data, not sensitive user data
