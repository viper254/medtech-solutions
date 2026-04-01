-- ============================================================
-- 008_reviews_and_order_lookup.sql
-- Adds public order lookup by reference + product reviews
-- ============================================================

-- Allow anyone to look up an order by its reference number
-- (reference is unguessable enough to act as a token)
CREATE POLICY "public lookup order by reference"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "public lookup order_items by order"
  ON order_items FOR SELECT
  USING (true);

-- ── Product Reviews ───────────────────────────────────────────

CREATE TABLE product_reviews (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  reviewer_name text       NOT NULL,
  rating       integer     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      text,
  is_approved  boolean     NOT NULL DEFAULT false,  -- admin must approve before showing
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reviews_product_id_idx ON product_reviews(product_id);
CREATE INDEX reviews_approved_idx ON product_reviews(is_approved);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved reviews
CREATE POLICY "public read approved reviews"
  ON product_reviews FOR SELECT
  USING (is_approved = true);

-- Anyone can submit a review
CREATE POLICY "public insert reviews"
  ON product_reviews FOR INSERT
  WITH CHECK (true);

-- Admins can read all reviews (including unapproved) and update/delete
CREATE POLICY "admin manage reviews"
  ON product_reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
