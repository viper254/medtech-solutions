-- ============================================================
-- 009_customer_accounts.sql
-- Customer profiles and linking orders to accounts
-- ============================================================

-- Customer profiles (extends auth.users)
CREATE TABLE customer_profiles (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    text,
  phone        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- Customers can read and update their own profile
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

-- Admins can read all profiles
CREATE POLICY "admin read profiles"
  ON customer_profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Add customer_id to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON orders(customer_id);

-- Allow customers to read their own orders
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

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_customer()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only create profile if not already an admin
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
