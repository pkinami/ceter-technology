-- Run after scripts/repair-current-schema.sql in a separate db execute command.
-- Converts old ProductStatus values to the current app values.

UPDATE "Product"
SET "status" = CASE
  WHEN "status"::text = 'ACTIVE' THEN 'PUBLISHED'::"ProductStatus"
  WHEN "status"::text = 'OUT_OF_STOCK' THEN 'PUBLISHED'::"ProductStatus"
  WHEN "status"::text = 'NEEDS_ATTENTION' THEN 'DRAFT'::"ProductStatus"
  ELSE "status"
END
WHERE "status"::text IN ('ACTIVE', 'OUT_OF_STOCK', 'NEEDS_ATTENTION');
