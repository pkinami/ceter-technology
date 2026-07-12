CREATE TABLE IF NOT EXISTS "ImportHistory" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "totalRows" INTEGER NOT NULL,
  "importedRecords" INTEGER NOT NULL,
  "failedRecords" INTEGER NOT NULL,
  "errorReport" JSONB,
  "adminId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ImportHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ImportHistory_type_idx" ON "ImportHistory"("type");
CREATE INDEX IF NOT EXISTS "ImportHistory_adminId_idx" ON "ImportHistory"("adminId");
CREATE INDEX IF NOT EXISTS "ImportHistory_createdAt_idx" ON "ImportHistory"("createdAt");

ALTER TABLE "ImportHistory"
  ADD CONSTRAINT "ImportHistory_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
