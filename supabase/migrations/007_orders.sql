-- ============================================================
-- 007_orders.sql
-- Orders table designed to support both WhatsApp and future
-- payment gateway (M-Pesa, card) integration
-- ============================================================

CREATE TABLE orders (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  reference         text          NOT NULL UNIQUE,  -- e.g. ORD-260401-4823

  -- Customer info (collected at checkout)
  customer_name     text,
  customer_phone    text,
  customer_email    text,
  delivery_address  text,

  -- Order totals
  subtotal          numeric(12,2) NOT NULL,
  delivery_fee      numeric(12,2) NOT NULL DEFAULT 0,
  total             numeric(12,2) NOT NULL,

  -- Order lifecycle status
  -- pending    → order placed, awaiting confirmation
  -- confirmed  → owner confirmed, being prepared
  -- dispatched → shipped / out for delivery
  -- delivered  → received by customer
  -- cancelled  → cancelled by owner or customer
  status            text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','dispatched','delivered','cancelled')),

  -- Channel: how the order was placed
  channel           text NOT NULL DEFAULT 'whatsapp'
    CHECK (channel IN ('whatsapp','mpesa','card','cash')),

  -- Payment status (ready for payment gateway integration)
  -- unpaid     → no payment received
  -- partial    → deposit paid
  -- paid       → fully paid
  -- refunded   → refunded to customer
  payment_status    text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','partial','paid','refunded')),

  -- Payment gateway fields (null until payment is integrated)
  payment_method    text,          -- 'mpesa' | 'card' | 'cash_on_delivery'
  payment_ref       text,          -- M-Pesa transaction ID or card auth code
  paid_at           timestamptz,

  -- Notes
  notes             text,          -- owner notes / customer special requests

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Order line items — one row per product in the order
CREATE TABLE order_items (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      uuid          REFERENCES products(id) ON DELETE SET NULL,
  product_name    text          NOT NULL,  -- snapshot at order time
  product_category text         NOT NULL,
  unit_price      numeric(12,2) NOT NULL,
  quantity        integer       NOT NULL CHECK (quantity > 0),
  line_total      numeric(12,2) NOT NULL,
  price_type      text          NOT NULL DEFAULT 'regular'
    CHECK (price_type IN ('offer','discounted','regular'))
);

-- Index for fast lookups
CREATE INDEX orders_reference_idx ON orders(reference);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX order_items_order_id_idx ON order_items(order_id);

-- Auto-update updated_at
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

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public can insert (place an order)
CREATE POLICY "public insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "public insert order_items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- Only admins can read and update orders
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
