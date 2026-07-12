-- Phase 4/5 order, payment, and checkout schema update.
-- Run against the Supabase PostgreSQL database if `npx prisma db push` is not available.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
  END IF;
END $$;

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderStatus" "OrderStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'CASH_ON_DELIVERY';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerName" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerEmail" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerPhone" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryAddress" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "country" TEXT;

UPDATE "Order"
SET "orderNumber" = 'CETER-LEGACY-' || UPPER(SUBSTRING("id", 1, 8))
WHERE "orderNumber" IS NULL;

UPDATE "Order" AS o
SET
  "customerName" = COALESCE(o."customerName", u."name", 'Guest Customer'),
  "customerEmail" = COALESCE(o."customerEmail", u."email", 'guest@ceter.local'),
  "customerPhone" = COALESCE(o."customerPhone", 'Not provided'),
  "deliveryAddress" = COALESCE(o."deliveryAddress", 'Not provided'),
  "city" = COALESCE(o."city", 'Not provided'),
  "country" = COALESCE(o."country", 'Kenya')
FROM "User" AS u
WHERE o."userId" = u."id";

UPDATE "Order"
SET
  "customerName" = COALESCE("customerName", 'Guest Customer'),
  "customerEmail" = COALESCE("customerEmail", 'guest@ceter.local'),
  "customerPhone" = COALESCE("customerPhone", 'Not provided'),
  "deliveryAddress" = COALESCE("deliveryAddress", 'Not provided'),
  "city" = COALESCE("city", 'Not provided'),
  "country" = COALESCE("country", 'Kenya');

ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "customerName" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "customerEmail" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "customerPhone" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "deliveryAddress" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "city" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "country" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "userId" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX IF NOT EXISTS "Order_userId_idx" ON "Order"("userId");

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "transactionId" TEXT,
  "paymentMethod" TEXT NOT NULL,
  "amount" DECIMAL(10, 2) NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'Payment_orderId_fkey'
  ) THEN
    ALTER TABLE "Payment"
    ADD CONSTRAINT "Payment_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Payment_orderId_idx" ON "Payment"("orderId");
CREATE INDEX IF NOT EXISTS "Payment_transactionId_idx" ON "Payment"("transactionId");
