-- ============================================================
-- 001_initial_schema.sql
-- MedTech Solutions Centre — initial schema, RLS, and storage
-- ============================================================

-- ─── Tables ──────────────────────────────────────────────────

CREATE TABLE products (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text          NOT NULL,
  category         text          NOT NULL CHECK (category IN ('Phones','Laptops','Desktops','Accessories')),
  description      text          NOT NULL,
  original_price   numeric(10,2) NOT NULL CHECK (original_price > 0),
  discounted_price numeric(10,2)           CHECK (discounted_price > 0 AND discounted_price < original_price),
  price_max        numeric(10,2)           CHECK (price_max > 0),
  offer_price      numeric(10,2)           CHECK (offer_price > 0),
  offer_expires_at timestamptz,
  stock_quantity   integer       NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE product_media (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  storage_path text    NOT NULL,
  type         text    NOT NULL CHECK (type IN ('image','video')),
  sort_order   integer NOT NULL DEFAULT 0
);

CREATE TABLE repair_services (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL,
  description          text NOT NULL,
  estimated_turnaround text NOT NULL
);

-- ─── Admins table ────────────────────────────────────────────
-- Only UIDs listed here can write products, media, and repair services.
-- Add your admin user's UUID after signing up via Supabase Auth.

CREATE TABLE admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Admins table itself: only admins can read it (no public access)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can read admins"
  ON admins FOR SELECT
  USING (auth.uid() = user_id);

-- ─── Row Level Security ───────────────────────────────────────

ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_media  ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_services ENABLE ROW LEVEL SECURITY;

-- products
CREATE POLICY "public read products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "admin write products"
  ON products FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- product_media
CREATE POLICY "public read product_media"
  ON product_media FOR SELECT
  USING (true);

CREATE POLICY "admin write product_media"
  ON product_media FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- repair_services
CREATE POLICY "public read repair_services"
  ON repair_services FOR SELECT
  USING (true);

CREATE POLICY "admin write repair_services"
  ON repair_services FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- ─── Storage: product-media bucket ───────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-media', 'product-media', true);

-- Public read: anyone can download objects from the bucket
CREATE POLICY "public read product-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-media');

-- Authenticated write: only signed-in users can upload/update/delete
CREATE POLICY "authenticated upload product-media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-media' AND EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "authenticated update product-media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-media' AND EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "authenticated delete product-media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-media' AND EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
