-- ============================================================
-- 011_repair_service_media.sql
-- Adds media support to repair services
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

-- Allow uploads to the existing product-media bucket
-- (reusing the same bucket, just a different path prefix)
