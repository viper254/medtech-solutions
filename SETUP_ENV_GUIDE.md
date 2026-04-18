# 🔧 Environment Setup Guide

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (or create one if you haven't)
3. Go to **Settings** → **API**
4. You'll see two important values:

### Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```
Copy this entire URL

### Anon/Public Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjE2MTYxNiwiZXhwIjoxOTMxNzM3NjE2fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
Copy this entire key (it's very long, that's normal)

## Step 2: Update Your .env File

Open the `.env` file in your project root and replace the placeholders:

```env
# Replace with your actual Supabase URL
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Replace with your actual Supabase Anon Key
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Change this to YOUR secret key (make it unique!)
VITE_DEV_CONTROL_KEY=medtech_dev_2024_my_secret_xyz789
```

## Step 3: Create a Strong Secret Key

For `VITE_DEV_CONTROL_KEY`, create something unique:

**Good examples:**
- `medtech_infinity_2024_xyz789_secure`
- `my_secret_medtech_control_abc123`
- `dev_panel_kisii_2024_qwerty456`

**Bad examples:**
- `password` (too simple)
- `123456` (too simple)
- `admin` (too simple)

**Tips:**
- Mix letters and numbers
- Make it at least 20 characters
- Don't use common words
- Keep it private!

## Step 4: Save and Test

1. Save the `.env` file
2. Restart your dev server:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then start again
   npm run dev
   ```

3. Test Supabase connection:
   - Visit your site
   - Try viewing products
   - If products load, Supabase is connected ✅

4. Test control panel:
   - Visit: `http://localhost:5173/dev/control?key=YOUR_SECRET_KEY`
   - Replace `YOUR_SECRET_KEY` with what you set in VITE_DEV_CONTROL_KEY
   - You should see the control panel ✅

## Step 5: Apply Database Migration

Before the control system works, you need to apply the database migration:

```bash
# If you have Supabase CLI installed
supabase db push

# OR manually in Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of: supabase/migrations/012_developer_control_system.sql
# 3. Paste and run
```

## 🔒 Security Checklist

- ✅ `.env` file is in `.gitignore` (already done)
- ✅ Never commit `.env` to git
- ✅ Never share your Supabase keys publicly
- ✅ Never share your control panel URL
- ✅ Use a strong secret key

## 🆘 Troubleshooting

### "Cannot read properties of undefined"
- Check that `.env` file exists in project root
- Check that variable names match exactly (including VITE_ prefix)
- Restart dev server after changing `.env`

### "Invalid API key"
- Double-check you copied the full Anon key from Supabase
- Make sure there are no extra spaces
- Verify you're using the correct project

### "Access Denied" on control panel
- Check that the key in URL matches VITE_DEV_CONTROL_KEY in .env
- Make sure you restarted the dev server after changing .env

### Products not loading
- Verify Supabase URL is correct
- Check that you've run the migrations
- Check browser console for errors

## 📝 Example .env File

Here's what a complete `.env` file looks like:

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjE2MTYxNiwiZXhwIjoxOTMxNzM3NjE2fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_DEV_CONTROL_KEY=medtech_infinity_2024_xyz789_secure
```

## ✅ Verification

Once everything is set up correctly:

1. ✅ Site loads without errors
2. ✅ Products display on homepage
3. ✅ Control panel accessible with secret key
4. ✅ No console errors about missing env variables

## 🚀 Next Steps

After `.env` is configured:

1. Apply database migration (Step 5 above)
2. Test the control panel
3. Try disabling/enabling the site
4. Record a test payment
5. Deploy to production

---

**Need help?** Check the browser console for specific error messages.
