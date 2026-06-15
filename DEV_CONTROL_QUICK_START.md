# Developer Control Panel - Quick Start Guide

## 🚀 What You Have Now

A complete kill switch system that lets you:
- ✅ Enable/disable the entire site with one click
- ✅ Track monthly payments from your client
- ✅ Auto-disable site when payment is overdue
- ✅ Show custom messages to customers and admin
- ✅ View payment history
- ✅ Set grace periods and due dates

## 📁 Files Created

### Components (Modular Design)
- `src/components/DevControl/StatusCard.tsx` - Shows current site status
- `src/components/DevControl/PaymentForm.tsx` - Record payments
- `src/components/DevControl/PaymentHistory.tsx` - View payment history
- `src/components/DevControl/SettingsForm.tsx` - Configure settings

### Main Page
- `src/pages/DevControlPanel.tsx` - Main control panel (uses all components above)

### Supporting Files
- `src/hooks/useSiteStatus.ts` - Hook to check site status
- `src/pages/SiteDisabledPage.tsx` - Page shown when site is disabled
- `src/components/PaymentWarningBanner.tsx` - Warning banner for admin
- `supabase/migrations/012_developer_control_system.sql` - Database setup

### Configuration
- `.env.local` - Test environment (already configured)
- `TESTING_KILL_SWITCH.md` - Complete testing guide

## 🔑 Access the Control Panel

**URL Format:**
```
http://localhost:5173/dev/control?key=YOUR_SECRET_KEY
```

**Your Current Test Key:**
```
http://localhost:5173/dev/control?key=phantom@2025
```

## 🧪 Testing Locally (Safe Environment)

### Step 1: Apply Database Migration

1. Go to your **TEST** Supabase project: https://supabase.com/dashboard
2. Open **SQL Editor**
3. Copy contents of `supabase/migrations/012_developer_control_system.sql`
4. Paste and run
5. Verify tables created:
   ```sql
   SELECT * FROM site_control;
   SELECT * FROM payment_history;
   ```

### Step 2: Start Dev Server

```bash
npm run dev
```

The `.env.local` file will automatically be used (test environment).

### Step 3: Access Control Panel

Visit: `http://localhost:5173/dev/control?key=phantom@2025`

### Step 4: Test Features

1. **Disable Site**
   - Click "Disable Site Now"
   - Visit homepage - should show "Store Temporarily Unavailable"

2. **Enable Site**
   - Go back to control panel
   - Click "Enable Site Now"
   - Homepage should work normally

3. **Record Payment**
   - Enter amount: 5000
   - Notes: "January payment"
   - Click "Record Payment & Extend 30 Days"
   - Payment appears in history
   - Due date extended automatically

4. **Configure Settings**
   - Set payment due date
   - Set grace period
   - Customize messages
   - Click "Save Settings"

## 🎯 How It Works

### For You (Developer)
- Access control panel with secret key
- One-click disable/enable
- Track all payments
- Full control over settings

### For Your Client (Admin)
- Sees warning banner when payment due soon
- Sees custom message if site disabled
- Cannot access control panel (no secret key)

### For Customers
- Site works normally when active
- Sees "Store Temporarily Unavailable" when disabled
- Cannot tell why site is disabled

## 🔒 Security Features

- ✅ Secret key required (stored in environment variable)
- ✅ Control panel hidden (no links to it anywhere)
- ✅ Only you know the URL and key
- ✅ Client cannot access control panel
- ✅ Fail-safe: Site stays active if check fails

## 📊 Control Panel Features

### Status Card
- Current site status (Active/Disabled)
- Payment status (Current/Due Soon/Overdue)
- Days until payment due
- Quick toggle button

### Payment Form
- Record payment amount
- Add notes (optional)
- Automatically extends due date by 30 days
- Re-enables site on payment

### Payment History
- Last 10 payments
- Date, amount, status, notes
- Easy to track payment patterns

### Settings Form
- Site active toggle
- Auto-disable on overdue
- Payment due date
- Grace period (days)
- Next payment amount
- Custom messages for customers and admin

## 🚀 Deploy to Production

### When You're Ready (After Testing)

1. **Update Production Environment**
   ```env
   # In .env (production)
   VITE_DEV_CONTROL_KEY=your_super_secret_key_here
   ```

2. **Apply Migration to Production**
   - Go to production Supabase
   - Run `012_developer_control_system.sql`

3. **Deploy to Vercel/Netlify**
   - Push to Git
   - Deployment happens automatically
   - Add environment variable in hosting dashboard

4. **Bookmark Control Panel URL**
   ```
   https://your-site.com/dev/control?key=your_super_secret_key_here
   ```

## 🆘 Common Issues

### "Control System Not Initialized"
- Migration not applied to database
- Run `012_developer_control_system.sql` in Supabase SQL Editor

### "Invalid access key"
- Wrong key in URL
- Check `VITE_DEV_CONTROL_KEY` in `.env.local`

### Site keeps loading forever
- Database function doesn't exist
- Apply migration to database

### Can't access control panel
- Make sure you're using the correct URL with `?key=` parameter
- Check environment variable is set

## 💡 Tips

1. **Bookmark the control panel URL** (with key) for quick access
2. **Set payment due date** to end of each month
3. **Use grace period** (3-7 days) to avoid accidental disable
4. **Customize messages** to be professional and clear
5. **Record payments immediately** to keep site active
6. **Check payment history** to track client's payment pattern

## 🔄 Monthly Workflow

1. Client pays monthly fee
2. You receive payment confirmation
3. Open control panel
4. Record payment (amount + notes)
5. System automatically:
   - Extends due date by 30 days
   - Re-enables site if disabled
   - Records payment in history

## 📝 Notes

- `.env.local` takes priority over `.env` (for testing)
- Test environment is completely separate from production
- No risk to production data during testing
- Delete `.env.local` or rename it to switch back to production
- Keep your secret key safe and private

## ✅ You're All Set!

The system is ready to test. Follow the testing guide in `TESTING_KILL_SWITCH.md` for detailed step-by-step instructions.

**Next Steps:**
1. Apply migration to test database
2. Start dev server
3. Access control panel
4. Test all features
5. Deploy to production when ready

---

**Need Help?** Check `TESTING_KILL_SWITCH.md` for detailed testing instructions.
