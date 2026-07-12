-- Marketplace automation, search, and performance indexes.
-- Apply after `prisma db push` or equivalent migration generation.

DO $$ BEGIN ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'NEEDS_ATTENTION'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "AutomationJob" ADD COLUMN IF NOT EXISTS "progress" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AutomationJob" ADD COLUMN IF NOT EXISTS "totalItems" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AutomationJob" ADD COLUMN IF NOT EXISTS "completedItems" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AutomationJob" ADD COLUMN IF NOT EXISTS "errors" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AutomationJob" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Product_brand_status_idx" ON "Product" ("brand", "status");
CREATE INDEX IF NOT EXISTS "Product_category_status_idx" ON "Product" ("categoryId", "status");
CREATE INDEX IF NOT EXISTS "Product_createdAt_idx" ON "Product" ("createdAt");
CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx" ON "Order" ("orderStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_payment_createdAt_idx" ON "Order" ("paymentStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "User_role_createdAt_idx" ON "User" ("role", "createdAt");

CREATE INDEX IF NOT EXISTS "Product_full_text_search_idx"
ON "Product"
USING GIN (
  to_tsvector(
    'english',
    coalesce("name", '') || ' ' || coalesce("brand", '') || ' ' || coalesce("description", '')
  )
);

CREATE INDEX IF NOT EXISTS "AutomationJob_status_updatedAt_idx" ON "AutomationJob" ("status", "updatedAt");
CREATE INDEX IF NOT EXISTS "AutomationLog_level_createdAt_idx" ON "AutomationLog" ("level", "createdAt");
