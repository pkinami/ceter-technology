DO $$ BEGIN
  CREATE TYPE "PermissionModule" AS ENUM (
    'PRODUCTS', 'ORDERS', 'CUSTOMERS', 'REPORTS', 'SETTINGS', 'USERS',
    'ROLES', 'PERMISSIONS', 'CATEGORIES', 'MEDIA', 'MARKETING'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PermissionAction" AS ENUM (
    'VIEW', 'CREATE', 'EDIT', 'DELETE', 'BULK', 'CANCEL', 'UPDATE_STATUS', 'EXPORT', 'MANAGE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DeliveryStatus" AS ENUM (
    'PENDING', 'READY_FOR_DISPATCH', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "UserRole" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Permission" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "module" "PermissionModule" NOT NULL,
  "action" "PermissionAction" NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "RolePermission" (
  "id" TEXT PRIMARY KEY,
  "roleId" TEXT NOT NULL REFERENCES "UserRole"("id") ON DELETE CASCADE,
  "permissionId" TEXT NOT NULL REFERENCES "Permission"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "UserRoleAssignment" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "roleId" TEXT NOT NULL REFERENCES "UserRole"("id") ON DELETE CASCADE,
  "assignedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "actorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "actorName" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "field" TEXT,
  "previousValue" JSONB,
  "newValue" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT;
UPDATE "Order"
SET "trackingNumber" = 'TRK-LEGACY-' || UPPER(SUBSTRING("id", 1, 10))
WHERE "trackingNumber" IS NULL;
ALTER TABLE "Order" ALTER COLUMN "trackingNumber" SET NOT NULL;

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryProvider" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryInfo" JSONB;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;

CREATE TABLE IF NOT EXISTS "OrderStatusHistory" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
  "previousStatus" "OrderStatus",
  "newStatus" "OrderStatus" NOT NULL,
  "note" TEXT,
  "changedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "OrderIssue" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "note" TEXT NOT NULL,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Permission_module_action_key" ON "Permission"("module", "action");
CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");
CREATE UNIQUE INDEX IF NOT EXISTS "UserRoleAssignment_userId_roleId_key" ON "UserRoleAssignment"("userId", "roleId");
CREATE UNIQUE INDEX IF NOT EXISTS "Order_trackingNumber_key" ON "Order"("trackingNumber");
CREATE INDEX IF NOT EXISTS "Order_trackingNumber_idx" ON "Order"("trackingNumber");
CREATE INDEX IF NOT EXISTS "AuditLog_module_idx" ON "AuditLog"("module");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
