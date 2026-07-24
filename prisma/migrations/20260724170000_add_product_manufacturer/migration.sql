ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "manufacturer" TEXT;

CREATE INDEX IF NOT EXISTS "Product_manufacturer_idx" ON "Product" ("manufacturer");
