# Medtech Solutions — Developer Guide

## Overview

Medtech Solutions is a full-stack ecommerce web application built with React, TypeScript, Vite, and Supabase. It serves as an online store for tech accessories and medical equipment, with WhatsApp-first ordering, order tracking, customer accounts, and a full admin panel.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage) |
| Deployment | Vercel |
| Testing | Vitest, fast-check (property-based) |
| Styling | Inline React styles + CSS modules |

---

## Prerequisites

- Node.js 20+
- npm
- A Supabase project (free tier works)

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/viper254/medtech-solutions.git
cd medtech-solutions
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find these in your Supabase project under **Settings → API**.

### 4. Run database migrations

Go to your Supabase project → **SQL Editor** and run each file in `supabase/migrations/` in order:

```
001_initial_schema.sql
002_add_medical_equipment_category.sql
003_admin_management.sql
004_bootstrap_super_admin.sql
005_fix_function_search_paths.sql
006_featured_products.sql
007_orders.sql
008_reviews_and_order_lookup.sql
009_customer_accounts.sql
010_add_others_category.sql
011_repair_service_media.sql
```

### 5. Start the dev server

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

---

## Project Structure

```
src/
├── components/       # Shared UI components
│   ├── Navbar.tsx
│   ├── ProductCard.tsx
│   ├── ProductReviews.tsx
│   ├── ProtectedRoute.tsx
│   ├── DeliveryStrip.tsx
│   ├── MediaGallery.tsx
│   ├── LoadingSpinner.tsx
│   └── WhatsAppFAB.tsx
├── pages/            # Route-level pages
│   ├── HomePage.tsx
│   ├── CatalogPage.tsx
│   ├── ProductDetailPage.tsx
│   ├── CartPage.tsx
│   ├── SearchResultsPage.tsx
│   ├── RepairServicesPage.tsx
│   ├── ContactPage.tsx
│   ├── DeliveryInfoPage.tsx
│   ├── OrderTrackingPage.tsx
│   ├── CustomerAuthPage.tsx
│   ├── AccountPage.tsx
│   ├── AdminLoginPage.tsx
│   ├── AdminDashboardPage.tsx
│   ├── AdminProductFormPage.tsx
│   ├── AdminRepairServicesPage.tsx
│   ├── AdminOrdersPage.tsx
│   ├── AdminReviewsPage.tsx
│   └── AdminManagePage.tsx
├── store/            # State management
│   ├── cartReducer.ts
│   └── customerAuth.ts
├── lib/
│   └── supabaseClient.ts
├── types/
│   └── index.ts
└── utils/
    ├── whatsapp.ts
    ├── search.ts
    ├── adminFormValidation.ts
    └── usePageTitle.ts
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | TypeScript check + Vite production build |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run all tests once |
| `npm run lint` | ESLint check |

---

## Deployment

The app deploys automatically to Vercel on every push to `main`.

**Required Vercel environment variables:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Set these in Vercel → Project → Settings → Environment Variables.

**Production branch:** `main`

---

## First-Time Admin Setup

1. Go to `/admin/login`
2. Click "Sign up" and create your account
3. Sign in — you are automatically made super admin (because the `admins` table was empty)
4. The "Manage Admins" button appears in your dashboard

---

## Testing

Tests use Vitest with property-based testing via fast-check.

```bash
npm run test          # run all tests once
npm run test:watch    # watch mode
```

Test files follow the pattern:
- `*.test.ts` — unit tests
- `*.property.test.ts` — property-based tests
