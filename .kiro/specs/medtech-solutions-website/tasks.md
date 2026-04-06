# Implementation Plan: MedTech Solutions Centre Website

## Overview

Build a React (Vite) SPA in TypeScript, deployed to Vercel. Supabase handles the database, storage, and auth. Cart state lives in localStorage. Orders are placed via pre-filled `wa.me` links.

## Tasks

- [x] 1. Project scaffolding and configuration
  - Scaffold Vite + React + TypeScript project
  - Install dependencies: `@supabase/supabase-js`, `react-router-dom`, `fast-check`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`
  - Configure Vitest with jsdom environment and `@testing-library/jest-dom` setup
  - Create `.env.example` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` placeholders
  - Create `src/lib/supabaseClient.ts` initialising the Supabase client from env vars
  - Add `vercel.json` rewrite rule for SPA routing
  - _Requirements: 8.1_

- [x] 2. TypeScript interfaces and core utility functions
  - [x] 2.1 Define TypeScript interfaces
    - Create `src/types/index.ts` with `Product`, `MediaItem`, `RepairService`, and `CartItem` interfaces matching the design document
    - _Requirements: 1.1, 5.1_

  - [x] 2.2 Implement `searchProducts` utility
    - Create `src/utils/search.ts` exporting `searchProducts(products: Product[], query: string): Product[]`
    - Case-insensitive match on `name` and `description`
    - _Requirements: 2.2_

  - [x] 2.3 Write property test for `searchProducts` (Property 3)
    - **Property 3: Search results contain only matching products**
    - **Validates: Requirements 2.2**

  - [x] 2.4 Implement `buildWhatsAppUrl` utility
    - Create `src/utils/whatsapp.ts` exporting `buildSingleProductUrl(product: Product): string` and `buildCartCheckoutUrl(items: CartItem[]): string`
    - URLs must target `wa.me/254793636022` with pre-filled text per the design message format
    - _Requirements: 4.1, 4.3_

  - [x] 2.5 Write property tests for `buildWhatsAppUrl` (Properties 5 and 6)
    - **Property 5: Single-product WhatsApp URL contains product name and effective price**
    - **Property 6: Cart checkout WhatsApp message contains all items**
    - **Validates: Requirements 4.1, 4.3**

  - [x] 2.6 Implement `cartReducer`
    - Create `src/store/cartReducer.ts` with actions: `ADD_ITEM`, `UPDATE_QUANTITY`, `REMOVE_ITEM`, `CLEAR_CART`
    - Effective price = `discounted_price ?? original_price`
    - Persist to and hydrate from `localStorage` key `medtech_cart`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 2.7 Write property tests for `cartReducer` (Properties 7 and 8)
    - **Property 7: Cart total invariant — total always equals sum of (effective_price × quantity)**
    - **Property 8: Adding a product increases item count**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 3. Supabase schema and RLS setup
  - Create `supabase/migrations/001_initial_schema.sql` with `products`, `product_media`, and `repair_services` tables matching the design schema (column types, CHECK constraints, defaults)
  - Add RLS policies: public SELECT on all three tables; authenticated-only INSERT/UPDATE/DELETE
  - Create `product-media` storage bucket with public read and authenticated write policy
  - _Requirements: 9.1, 9.4, 9.5, 9.10_

- [x] 4. Checkpoint — Ensure all utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Shared UI components
  - [x] 5.1 Implement `Navbar`
    - Logo, category nav links, search bar (submits to `/search?q=`), cart icon with item-count badge
    - Mobile-responsive hamburger menu
    - _Requirements: 2.1, 5.1, 8.2, 8.3_

  - [x] 5.2 Implement `ProductCard`
    - Display name, thumbnail, original price; strike-through original and show discounted price when `discounted_price` is non-null; "Out of Stock" badge when `stock_quantity === 0`; "Add to Cart" button (disabled when out of stock)
    - Non-empty `alt` text on the thumbnail image
    - _Requirements: 1.3, 1.4, 1.5, 2.4, 10.3_

  - [x] 5.3 Write property test for `ProductCard` rendering (Property 2)
    - **Property 2: Product card renders all required fields**
    - **Validates: Requirements 1.3, 1.4, 1.5, 2.4**

  - [x] 5.4 Write property test for alt text presence (Property 15)
    - **Property 15: All product images have non-empty alt text**
    - **Validates: Requirements 10.3**

  - [x] 5.5 Implement `MediaGallery`
    - Image/video carousel for product detail page; lazy-loads off-screen media
    - Non-empty `alt` text on every `<img>`
    - _Requirements: 1.3, 10.2, 10.3_

  - [x] 5.6 Implement `WhatsAppFAB`
    - Floating action button linking to `https://wa.me/254793636022`, visible on all pages
    - _Requirements: 4.2_

  - [x] 5.7 Implement `LoadingSpinner` and `ProtectedRoute`
    - `LoadingSpinner`: shown during data fetches
    - `ProtectedRoute`: reads Supabase session; redirects to `/admin/login` if unauthenticated
    - _Requirements: 1.6, 9.1, 9.10_

  - [x] 5.8 Write unit test for `ProtectedRoute` (Property 10)
    - **Property 10: Unauthenticated users cannot access admin routes**
    - **Validates: Requirements 9.1, 9.10**

- [x] 6. Public pages — Catalog and Product Detail
  - [x] 6.1 Implement `CatalogPage`
    - Fetch products from Supabase; category tab filter; render `ProductCard` grid; loading and empty-state messages
    - _Requirements: 1.1, 1.2, 1.6, 1.7_

  - [x] 6.2 Write property test for category filter (Property 1)
    - **Property 1: Category filter shows only matching products**
    - **Validates: Requirements 1.2**

  - [x] 6.3 Implement `ProductDetailPage`
    - Fetch single product by `id`; render `MediaGallery`, full description, prices, stock status, delivery/payment summary, "Order Now" WhatsApp CTA, "Add to Cart" button
    - _Requirements: 1.3, 1.4, 1.5, 4.1, 7.3_

  - [x] 6.4 Write property test for delivery summary on detail page (Property 9)
    - **Property 9: Product detail page includes delivery and payment summary**
    - **Validates: Requirements 7.3**

- [x] 7. Public pages — Search, Cart, and static pages
  - [x] 7.1 Implement `SearchResultsPage`
    - Read `q` from URL query params; call `searchProducts`; render matching `ProductCard` grid; "No results" empty state with WhatsApp suggestion
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 7.2 Implement `CartPage`
    - Render cart items (name, quantity stepper, unit price, subtotal); total price; "Checkout via WhatsApp" button calling `buildCartCheckoutUrl`; empty-cart message
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 4.3_

  - [x] 7.3 Implement `RepairServicesPage`
    - Fetch repair services from Supabase; render name, description, estimated turnaround; WhatsApp and phone CTAs
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 7.4 Write property test for repair services page (Property 4)
    - **Property 4: Repair service page renders description and turnaround for every service**
    - **Validates: Requirements 3.2**

  - [x] 7.5 Implement `ContactPage`
    - Business name, address, phone number (`tel:` link), WhatsApp link, operating hours, Google Maps embed/link for Market Plaza Kisii Town
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 7.6 Implement `DeliveryInfoPage` and delivery strip on `HomePage`
    - Standalone delivery info page; reusable delivery/payment strip component used on `HomePage` and `ProductDetailPage`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 7.7 Implement `HomePage`
    - Hero banner, featured products section (e.g., latest 4 products), delivery/payment info strip, WhatsApp CTA
    - _Requirements: 7.1, 7.2_

- [x] 8. Checkpoint — Ensure all public page tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Admin panel
  - [x] 9.1 Implement `AdminLoginPage`
    - Email + password form; call `supabase.auth.signInWithPassword`; redirect to `/admin` on success; show "Invalid email or password" on failure
    - _Requirements: 9.1, 9.10_

  - [x] 9.2 Implement `AdminDashboardPage`
    - Fetch and list all products with edit and delete action buttons; confirm dialog before deletion; show success/error toast after delete
    - _Requirements: 9.7, 9.8_

  - [x] 9.3 Implement `AdminProductFormPage` (create and edit)
    - Form fields: name, category (select), description, original price, discounted price (optional), stock quantity, media upload (multi-file, images and videos)
    - Client-side validation: required fields, `discounted_price < original_price`, at least one image
    - On save: upsert product row, upload new media files to `product-media` bucket, insert `product_media` rows
    - Show inline validation errors for missing/invalid fields
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.9_

  - [x] 9.4 Write property test for admin form validation (Property 11)
    - **Property 11: Product form validation rejects any missing required field**
    - **Validates: Requirements 9.2, 9.9**

  - [x] 9.5 Write property tests for Supabase CRUD round-trips (Properties 12, 13, 14)
    - **Property 12: Discounted price round-trip**
    - **Property 13: Product edit round-trip**
    - **Property 14: Deleted product no longer appears in catalog**
    - **Validates: Requirements 9.4, 9.7, 9.8**
    - Note: use Supabase local dev or mock the client for these tests

- [x] 10. Routing and app wiring
  - Create `src/App.tsx` with `react-router-dom` routes for all pages
  - Wrap admin routes with `ProtectedRoute`
  - Provide cart context (from `cartReducer`) via React Context to the whole app
  - Mount `Navbar` and `WhatsAppFAB` outside the route outlet so they appear on every page
  - _Requirements: 4.2, 5.1, 9.1, 9.10_

- [x] 11. Responsive design and accessibility polish
  - Audit all pages for mobile-first layout correctness at 320px, 768px, and 1280px breakpoints
  - Verify touch-friendly nav menu on mobile
  - Verify all `<img>` elements have non-empty `alt` attributes
  - Verify sufficient color contrast on text and interactive elements
  - Add `loading="lazy"` to off-viewport images
  - _Requirements: 8.1, 8.2, 8.3, 10.2, 10.3, 10.4_

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with `{ numRuns: 100 }` and the tag format `// Feature: medtech-solutions-website, Property N: <text>`
- Supabase CRUD round-trip property tests (9.5) should mock the Supabase client or use a local Supabase instance
- For Vercel, SPA routing uses a rewrite to `index.html` (see `vercel.json`)
