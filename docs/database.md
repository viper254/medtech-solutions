# Medtech Solutions — Database & API Documentation

## Overview

The database runs on Supabase (PostgreSQL). All tables have Row Level Security (RLS) enabled. The frontend communicates directly with Supabase using the anon key — no separate backend server.

---

## Tables

### `products`

Stores all product listings.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| name | text | Product name |
| category | text | One of: Phones, Laptops, Desktops, Accessories, Medical Equipment, Others |
| description | text | Full product description |
| original_price | numeric(10,2) | Full price in KES |
| discounted_price | numeric(10,2) \| null | Sale price (must be < original_price) |
| price_max | numeric(10,2) \| null | Upper bound for price ranges |
| offer_price | numeric(10,2) \| null | Limited-time flash sale price |
| offer_expires_at | timestamptz \| null | When the offer expires |
| stock_quantity | integer | Units available |
| is_featured | boolean | Show in Featured section on homepage |
| low_stock_threshold | integer | Show "Only X left" badge below this stock level |
| created_at | timestamptz | Auto-set on insert |
| updated_at | timestamptz | Auto-set on insert |

**RLS:** Public read. Admin write only.

---

### `product_media`

Media files (images/videos) attached to products.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| product_id | uuid | FK → products.id |
| storage_path | text | Path in Supabase Storage `product-media` bucket |
| type | text | `image` or `video` |
| sort_order | integer | Display order |

**RLS:** Public read. Admin write only.

---

### `repair_services`

Repair service listings shown on the public repairs page.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| name | text | Service name |
| description | text | Service description |
| estimated_turnaround | text | e.g. "1–2 hours" |

**RLS:** Public read. Admin write only.

---

### `repair_service_media`

Media files attached to repair services.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| service_id | uuid | FK → repair_services.id |
| storage_path | text | Path in Supabase Storage `product-media` bucket |
| type | text | `image` or `video` |
| sort_order | integer | Display order |

**RLS:** Public read. Admin write only.

---

### `orders`

Customer orders. Designed to support WhatsApp, M-Pesa, and card payments.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| reference | text | Unique order reference e.g. `ORD-260401-4823` |
| customer_id | uuid \| null | FK → auth.users (null for guest orders) |
| customer_name | text \| null | Customer name |
| customer_phone | text \| null | Customer phone |
| customer_email | text \| null | Customer email |
| delivery_address | text \| null | Delivery address |
| subtotal | numeric(12,2) | Order subtotal |
| delivery_fee | numeric(12,2) | Delivery fee (default 0) |
| total | numeric(12,2) | Total amount |
| status | text | `pending` \| `confirmed` \| `dispatched` \| `delivered` \| `cancelled` |
| channel | text | `whatsapp` \| `mpesa` \| `card` \| `cash` |
| payment_status | text | `unpaid` \| `partial` \| `paid` \| `refunded` |
| payment_method | text \| null | Payment method (for future gateway integration) |
| payment_ref | text \| null | M-Pesa transaction ID or card auth code |
| paid_at | timestamptz \| null | When payment was received |
| notes | text \| null | Admin or customer notes |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-updated via trigger |

**RLS:** Public insert. Customers read own orders. Admins read/update all.

---

### `order_items`

Line items for each order.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| order_id | uuid | FK → orders.id |
| product_id | uuid \| null | FK → products.id (null if product deleted) |
| product_name | text | Snapshot of product name at order time |
| product_category | text | Snapshot of category |
| unit_price | numeric(12,2) | Price per unit at order time |
| quantity | integer | Quantity ordered |
| line_total | numeric(12,2) | unit_price × quantity |
| price_type | text | `offer` \| `discounted` \| `regular` |

**RLS:** Public insert. Customers read own order items. Admins read all.

---

### `product_reviews`

Customer reviews for products.

| Column | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| product_id | uuid | FK → products.id |
| reviewer_name | text | Customer's name |
| rating | integer | 1–5 stars |
| comment | text \| null | Review text |
| is_approved | boolean | Must be approved by admin before showing publicly |
| created_at | timestamptz | Auto-set |

**RLS:** Public read (approved only). Public insert. Admins manage all.

---

### `admins`

Users with admin panel access.

| Column | Type | Description |
|---|---|---|
| user_id | uuid | PK, FK → auth.users |
| email | text | Admin email |
| is_super_admin | boolean | Can manage other admins |
| added_at | timestamptz | When they were added |

**RLS:** Admins read own row. Super admins manage all (via RPC functions).

---

### `customer_profiles`

Extended profile data for customer accounts.

| Column | Type | Description |
|---|---|---|
| user_id | uuid | PK, FK → auth.users |
| full_name | text \| null | Customer's full name |
| phone | text \| null | Phone / WhatsApp number |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-set |

**RLS:** Customers read/update own profile. Admins read all.

---

## Storage

One bucket: **`product-media`** (public)

Used for both product images/videos and repair service media.

Path conventions:
- Products: `{product_id}/{timestamp}-{index}.{ext}`
- Repairs: `repairs/{service_id}/{timestamp}-{index}.{ext}`

---

## RPC Functions

| Function | Description |
|---|---|
| `bootstrap_super_admin(user_email)` | Makes the first user super admin on first login |
| `get_admins()` | Returns all admin rows (admin only) |
| `add_admin_by_email(target_email)` | Adds a user as admin by email (super admin only) |
| `remove_admin(target_uid)` | Removes an admin (super admin only, cannot remove self) |

All functions use `SECURITY DEFINER SET search_path = public`.

---

## Migrations

Run in order from `supabase/migrations/`:

| File | Description |
|---|---|
| 001_initial_schema.sql | Base tables, RLS, storage bucket |
| 002_add_medical_equipment_category.sql | Adds Medical Equipment category |
| 003_admin_management.sql | Super admin flag, admin management RPCs |
| 004_bootstrap_super_admin.sql | Auto-promote first user RPC |
| 005_fix_function_search_paths.sql | Security fix for all RPC functions |
| 006_featured_products.sql | is_featured and low_stock_threshold columns |
| 007_orders.sql | Orders and order_items tables |
| 008_reviews_and_order_lookup.sql | Product reviews, public order lookup |
| 009_customer_accounts.sql | Customer profiles, customer_id on orders |
| 010_add_others_category.sql | Adds Others category |
| 011_repair_service_media.sql | Media support for repair services |
