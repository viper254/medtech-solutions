-- ============================================================
-- 010_add_others_category.sql
-- Adds 'Others' to the products category constraint
-- ============================================================

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE products
  ADD CONSTRAINT products_category_check
  CHECK (category IN ('Phones', 'Laptops', 'Desktops', 'Accessories', 'Medical Equipment', 'Others'));
