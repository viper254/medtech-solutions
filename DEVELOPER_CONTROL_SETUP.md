# Developer Control System - Quick Setup

## ✅ Setup Checklist

### Step 1: Apply Database Migration
```bash
# Run this in your terminal
supabase db push
```

Or manually in Supabase Dashboard:
1. Go to SQL Editor
2. Open `supabase/migrations/012_developer_control_system.sql`
3. Run the SQL

### Step 2: Change Secret Key
1. Open `src/pages/DevControlPanel.tsx`
2. Find line 8: `const SECRET_KEY = 'dev_control_2024_secure_key_change_this';`
3. Change to something unique and secure
4. Example: `const SECRET_KEY = 'medtech_xyz_2024_my_secret_789';`

### Step 3: Test the System
1. Deploy your changes
2. Visit: `https://your-site.com/dev/control?key=YOUR_SECRET_KEY`
3. You should see the control panel
4. Try toggling the site off/on

### Step 4: Bookmark Control Panel
Save this URL in your browser (with your secret key):
```
https://your-site.com/dev/control?key=YOUR_SECRET_KEY
```

## 🎯 Quick Usage

### To Disable Site Immediately
1. Go to control panel
2. Click "🔴 Disable Site Now"
3. Done! Site shows "unavailable" page

### To Record Payment
1. Go to control panel
2. Enter payment amount (e.g., 5000)
3. Click "Record Payment & Extend 30 Days"
4. Site automatically extended for 30 days

### To Set Auto-Disable
1. Go to control panel
2. Set "Payment Due Date" (e.g., end of month)
3. Set "Grace Period" (e.g., 3 days)
4. Enable "Auto-Disable on Overdue"
5. Click "Save Settings"

## 🔒 Security Reminders

- ✅ Change the default secret key
- ✅ Keep control panel URL private
- ✅ Don't commit secret key to public repos
- ✅ Use HTTPS in production
- ✅ Bookmark the URL securely

## 📋 What You Get

### Control Panel Features
- One-click site enable/disable
- Payment recording with auto-extension
- Payment history tracking
- Auto-disable on overdue payments
- Custom messages for customers vs admin
- Grace period configuration

### Admin Features
- Payment warning banners (7 days before due)
- Urgent warnings (3 days before due)
- Clear messaging when site is disabled

### Customer Experience
- Professional "temporarily unavailable" page
- Contact information still accessible
- No technical/payment details exposed

## 🚀 First Payment Example

1. Client pays you KES 5,000 for January
2. Go to control panel
3. Enter amount: 5000
4. Notes: "January 2024 payment"
5. Click "Record Payment & Extend 30 Days"
6. Site now active until ~30 days from today
7. Admin will see warning 7 days before due date

## 📞 Support

Full documentation: `docs/developer-control-system.md`

Key files:
- Database: `supabase/migrations/012_developer_control_system.sql`
- Control Panel: `src/pages/DevControlPanel.tsx`
- Disabled Page: `src/pages/SiteDisabledPage.tsx`

---

**Ready to go!** Just complete the 4 setup steps above and you're in control.
