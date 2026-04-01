-- ============================================================
-- 006_featured_products.sql
-- Adds is_featured flag and low_stock_threshold to products
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5;
