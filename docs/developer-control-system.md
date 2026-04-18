# Developer Control System Documentation

## Overview

This system allows you (the developer) to control site availability based on payment status. You can disable the entire site with one click, set automatic payment due dates, and track payment history.

## Features

### For You (Developer)
- **Secret Control Panel**: Access via `/dev/control?key=YOUR_SECRET_KEY`
- **One-Click Toggle**: Instantly enable/disable the entire site
- **Payment Tracking**: Record payments and automatically extend site access
- **Auto-Disable**: Automatically disable site when payment is overdue
- **Grace Periods**: Set grace period days before auto-disable kicks in
- **Custom Messages**: Set different messages for customers vs admin
- **Payment History**: View all payment records

### For Client (Admin)
- **Warning Banners**: See payment due warnings in admin dashboard
- **Grace Period**: Continue working during grace period
- **Clear Messages**: Know exactly why site is disabled and who to contact

### For Customers
- **Professional Page**: Clean "temporarily unavailable" message
- **Contact Info**: Can still reach business via WhatsApp/phone
- **No Technical Details**: Don't see payment/admin issues

## Setup Instructions

### 1. Run Database Migration

First, apply the database migration:

```bash
# If using Supabase CLI
supabase db push

# Or run the SQL file directly in Supabase Dashboard
# Go to SQL Editor and run: supabase/migrations/012_developer_control_system.sql
```

### 2. Change the Secret Key

**IMPORTANT**: Change the secret key in `src/pages/DevControlPanel.tsx`:

```typescript
// Line 8 - Change this to something unique and secure
const SECRET_KEY = 'dev_control_2024_secure_key_change_this';
```

Make it long, random, and keep it private. Example:
```typescript
const SECRET_KEY = 'my_secret_medtech_2024_xyz789_control';
```

### 3. Bookmark Your Control Panel URL

Once deployed, bookmark this URL (with your secret key):
```
https://your-site.com/dev/control?key=YOUR_SECRET_KEY
```

**Keep this URL private!** Anyone with this URL can control the site.

## How to Use

### Accessing the Control Panel

1. Navigate to: `https://your-site.com/dev/control?key=YOUR_SECRET_KEY`
2. You'll see the developer control panel with all options

### Recording a Payment

When client pays:

1. Go to control panel
2. Find "Record Payment" section
3. Enter payment amount (e.g., 5000)
4. Add notes (optional, e.g., "January 2024 payment")
5. Click "Record Payment & Extend 30 Days"

This will:
- Record the payment in history
- Extend site access for 30 days from today
- Re-enable site if it was disabled
- Update payment due date

### Quick Toggle (Emergency)

To instantly disable/enable site:

1. Go to control panel
2. Click the big "Disable Site Now" or "Enable Site Now" button
3. Site changes immediately

Use this if:
- Payment is very overdue
- Client requests temporary shutdown
- Emergency maintenance needed

### Setting Payment Due Dates

1. Go to "Site Control Settings" section
2. Set "Payment Due Date" to when payment is expected
3. Set "Grace Period" (default 3 days)
4. Enable "Auto-Disable on Overdue"
5. Click "Save Settings"

The site will automatically disable after: `Due Date + Grace Period`

### Customizing Messages

You can set custom messages for when site is disabled:

**Customer Message**: Shown to regular visitors
```
Our store is temporarily unavailable for maintenance. We'll be back soon!
```

**Admin Message**: Shown to your client in admin panel
```
Payment is overdue. Please contact your developer to restore access.
```

## How It Works

### Auto-Disable Logic

1. System checks payment due date every time site loads
2. If current date > (due date + grace period), site auto-disables
3. Admin sees payment warning 7 days before due date
4. Warning becomes urgent 3 days before due date
5. After due date + grace period, site shows disabled page

### Security

- Control panel requires secret key in URL
- Database tables have RLS policies (no direct access)
- Only accessible through secure functions
- Client cannot access or modify these settings
- Even if client is super admin, they can't bypass this

### What Gets Disabled

When site is disabled:
- ✅ Control panel still accessible (with secret key)
- ❌ All public pages (home, catalog, products, etc.)
- ❌ Admin dashboard and management pages
- ❌ Cart and checkout
- ✅ Contact information still visible on disabled page

## Payment Workflow Example

### Month 1 (Initial Setup)
1. Client pays first month: KES 5,000
2. You record payment in control panel
3. Site active until February 15, 2024
4. Grace period: 3 days (until February 18)

### Month 2 (On Time Payment)
- February 10: Admin sees "Payment due in 5 days" warning
- February 14: Client pays KES 5,000
- You record payment → site extended to March 15
- Warning disappears

### Month 3 (Late Payment)
- March 10: Admin sees "Payment due in 5 days" warning
- March 15: Payment due date passes
- March 16-18: Grace period (site still active, urgent warning)
- March 19: Auto-disable kicks in
- Site shows disabled page to everyone
- Admin sees "Payment overdue" message
- March 20: Client pays, you record payment
- Site immediately re-enabled, extended to April 19

## Troubleshooting

### "Access Denied" on Control Panel
- Check that secret key in URL matches the one in code
- Make sure you're using the correct URL format

### Site Not Auto-Disabling
- Check that "Auto-Disable on Overdue" is enabled
- Verify payment due date is set correctly
- Check grace period setting
- Try manually toggling site off/on to test

### Client Can Still Access Admin
- This shouldn't happen - disabled page shows for everyone
- Check that migration was applied correctly
- Verify `get_site_status()` function exists in database

### Payment Not Recording
- Check Supabase connection
- Verify you have proper permissions
- Check browser console for errors

## Best Practices

1. **Set Reminders**: Set your own reminders 2-3 days before client's due date
2. **Communicate**: Warn client before auto-disable happens
3. **Grace Period**: 3 days is reasonable, adjust as needed
4. **Record Immediately**: Record payments as soon as received
5. **Keep History**: Don't delete payment records (useful for disputes)
6. **Backup Key**: Save secret key in password manager
7. **Test First**: Test the system before relying on it

## Environment Variables (Optional)

For extra security, you can move the secret key to environment variables:

1. Add to `.env`:
```
VITE_DEV_CONTROL_KEY=your_secret_key_here
```

2. Update `DevControlPanel.tsx`:
```typescript
const SECRET_KEY = import.meta.env.VITE_DEV_CONTROL_KEY || 'fallback_key';
```

3. Add to `.env.example`:
```
VITE_DEV_CONTROL_KEY=change_this_secret_key
```

## Support

If you need to modify this system:
- Database schema: `supabase/migrations/012_developer_control_system.sql`
- Control panel: `src/pages/DevControlPanel.tsx`
- Disabled page: `src/pages/SiteDisabledPage.tsx`
- Status hook: `src/hooks/useSiteStatus.ts`
- Warning banner: `src/components/PaymentWarningBanner.tsx`

## Security Notes

⚠️ **IMPORTANT**:
- Never commit the secret key to public repositories
- Change the default secret key immediately
- Don't share control panel URL with anyone
- Use HTTPS in production
- Consider adding IP whitelist for extra security
- Regularly check payment history for anomalies

## Quick Reference

| Action | Steps |
|--------|-------|
| Disable site | Control panel → Quick toggle button |
| Enable site | Control panel → Quick toggle button |
| Record payment | Control panel → Record Payment section → Enter amount → Submit |
| Set due date | Control panel → Site Control Settings → Payment Due Date |
| View history | Control panel → Payment History section |
| Change messages | Control panel → Site Control Settings → Customer/Admin Message |

---

**Remember**: This system gives you complete control. Use it responsibly and communicate clearly with your client about payment expectations.
