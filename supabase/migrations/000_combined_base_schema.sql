-- ============================================================
-- COMBINED BASE SCHEMA (Migrations 001-011)
-- MedTech Solutions - Complete Database Setup
-- ============================================================

-- ============================================================
-- 001: Initial Schema
-- ============================================================

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

CREATE TABLE admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can read admins"
  ON admins FOR SELECT
  USING (auth.uid() = user_id);

ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_media  ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "admin write products"
  ON products FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "public read product_media"
  ON product_media FOR SELECT
  USING (true);

CREATE POLICY "admin write product_media"
  ON product_media FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "public read repair_services"
  ON repair_services FOR SELECT
  USING (true);

CREATE POLICY "admin write repair_services"
  ON repair_services FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-media', 'product-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read product-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-media');

CREATE POLICY "authenticated upload product-media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-media' AND EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "authenticated update product-media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-media' AND EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "authenticated delete product-media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-media' AND EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- ============================================================
-- 002: Add Medical Equipment Category
-- ============================================================

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE products
  ADD CONSTRAINT products_category_check
  CHECK (category IN ('Phones', 'Laptops', 'Desktops', 'Accessories', 'Medical Equipment'));

-- ============================================================
-- 003: Admin Management
-- ============================================================

ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS added_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE admins ADD COLUMN IF NOT EXISTS role text DEFAULT 'admin';

CREATE OR REPLACE FUNCTION get_admins()
RETURNS TABLE (user_id uuid, email text, is_super_admin boolean, added_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, email, is_super_admin, added_at
  FROM admins
  ORDER BY added_at ASC;
$$;

CREATE OR REPLACE FUNCTION add_admin_by_email(target_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_uid uuid;
  caller_is_super boolean;
BEGIN
  SELECT is_super_admin INTO caller_is_super
  FROM admins WHERE user_id = auth.uid();

  IF NOT FOUND OR NOT caller_is_super THEN
    RETURN json_build_object('error', 'Not authorized');
  END IF;

  SELECT id INTO target_uid
  FROM auth.users WHERE email = target_email LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'No user found with that email. They must sign up first.');
  END IF;

  INSERT INTO admins (user_id, email, is_super_admin)
  VALUES (target_uid, target_email, false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN json_build_object('success', true, 'user_id', target_uid);
END;
$$;

CREATE OR REPLACE FUNCTION remove_admin(target_uid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_super boolean;
BEGIN
  SELECT is_super_admin INTO caller_is_super
  FROM admins WHERE user_id = auth.uid();

  IF NOT FOUND OR NOT caller_is_super THEN
    RETURN json_build_object('error', 'Not authorized');
  END IF;

  IF target_uid = auth.uid() THEN
    RETURN json_build_object('error', 'You cannot remove yourself.');
  END IF;

  DELETE FROM admins WHERE user_id = target_uid AND is_super_admin = false;

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- 004: Bootstrap Super Admin
-- ============================================================

CREATE OR REPLACE FUNCTION bootstrap_super_admin(user_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM admins;

  IF admin_count = 0 THEN
    INSERT INTO admins (user_id, email, is_super_admin)
    VALUES (auth.uid(), user_email, true)
    ON CONFLICT (user_id) DO UPDATE
      SET is_super_admin = true,
          email = EXCLUDED.email;

    RETURN json_build_object('bootstrapped', true);
  END IF;

  RETURN json_build_object('bootstrapped', false);
END;
$$;

-- ============================================================
-- 006: Featured Products
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5;

-- ============================================================
-- 007: Orders
-- ============================================================

CREATE TABLE orders (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  reference         text          NOT NULL UNIQUE,
  customer_name     text,
  customer_phone    text,
  customer_email    text,
  delivery_address  text,
  subtotal          numeric(12,2) NOT NULL,
  delivery_fee      numeric(12,2) NOT NULL DEFAULT 0,
  total             numeric(12,2) NOT NULL,
  status            text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','dispatched','delivered','cancelled')),
  channel           text NOT NULL DEFAULT 'whatsapp'
    CHECK (channel IN ('whatsapp','mpesa','card','cash')),
  payment_status    text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','partial','paid','refunded')),
  payment_method    text,
  payment_ref       text,
  paid_at           timestamptz,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      uuid          REFERENCES products(id) ON DELETE SET NULL,
  product_name    text          NOT NULL,
  product_category text         NOT NULL,
  unit_price      numeric(12,2) NOT NULL,
  quantity        integer       NOT NULL CHECK (quantity > 0),
  line_total      numeric(12,2) NOT NULL,
  price_type      text          NOT NULL DEFAULT 'regular'
    CHECK (price_type IN ('offer','discounted','regular'))
);

CREATE INDEX orders_reference_idx ON orders(reference);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX order_items_order_id_idx ON order_items(order_id);

CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_orders_updated_at();

ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "public insert order_items"
  ON order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "admin read orders"
  ON orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "admin update orders"
  ON orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "admin read order_items"
  ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- ============================================================
-- 008: Reviews and Order Lookup
-- ============================================================

CREATE POLICY "public lookup order by reference"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "public lookup order_items by order"
  ON order_items FOR SELECT
  USING (true);

CREATE TABLE product_reviews (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  reviewer_name text       NOT NULL,
  rating       integer     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      text,
  is_approved  boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reviews_product_id_idx ON product_reviews(product_id);
CREATE INDEX reviews_approved_idx ON product_reviews(is_approved);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read approved reviews"
  ON product_reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "public insert reviews"
  ON product_reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "admin manage reviews"
  ON product_reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- ============================================================
-- 009: Customer Accounts
-- ============================================================

CREATE TABLE customer_profiles (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    text,
  phone        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer read own profile"
  ON customer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "customer update own profile"
  ON customer_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "customer insert own profile"
  ON customer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin read profiles"
  ON customer_profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON orders(customer_id);

CREATE POLICY "customer read own orders"
  ON orders FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "customer read own order_items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION handle_new_customer()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = NEW.id) THEN
    INSERT INTO customer_profiles (user_id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_customer();

-- ============================================================
-- 010: Add Others Category
-- ============================================================

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE products
  ADD CONSTRAINT products_category_check
  CHECK (category IN ('Phones', 'Laptops', 'Desktops', 'Accessories', 'Medical Equipment', 'Others'));

-- ============================================================
-- 011: Repair Service Media
-- ============================================================

CREATE TABLE repair_service_media (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id      uuid    NOT NULL REFERENCES repair_services(id) ON DELETE CASCADE,
  storage_path    text    NOT NULL,
  type            text    NOT NULL CHECK (type IN ('image','video')),
  sort_order      integer NOT NULL DEFAULT 0
);

CREATE INDEX repair_service_media_service_id_idx ON repair_service_media(service_id);

ALTER TABLE repair_service_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read repair_service_media"
  ON repair_service_media FOR SELECT USING (true);

CREATE POLICY "admin write repair_service_media"
  ON repair_service_media FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- ============================================================
-- END OF COMBINED BASE SCHEMA
-- ============================================================
