-- ============================================================
-- 002_add_medical_equipment_category.sql
-- Adds 'Medical Equipment' to the products category constraint
-- ============================================================

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE products
  ADD CONSTRAINT products_category_check
  CHECK (category IN ('Phones', 'Laptops', 'Desktops', 'Accessories', 'Medical Equipment'));
