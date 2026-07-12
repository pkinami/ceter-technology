DO $$ BEGIN CREATE TYPE "DataSourceType" AS ENUM ('MANUFACTURER', 'SUPPLIER', 'DISTRIBUTOR', 'RETAILER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ConnectionType" AS ENUM ('API', 'EXCEL', 'CSV', 'XML', 'JSON', 'WEB_CATALOGUE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "SourceCountry" AS ENUM ('KENYA', 'INTERNATIONAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "UpdateFrequency" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "IntegrationStatus" AS ENUM ('ACTIVE', 'INACTIVE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AutomationJobType" AS ENUM ('MANUFACTURER_SYNC', 'SUPPLIER_SYNC', 'CATALOGUE_IMPORT', 'IMAGE_COLLECTION', 'SPEC_EXTRACTION', 'PRODUCT_ENRICHMENT', 'PRICE_UPDATE', 'MARKET_PRICE_CHECK', 'INVENTORY_UPDATE', 'SEO_GENERATION', 'MARKETING_ANALYSIS', 'BUSINESS_REPORT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AutomationJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ProductSourceStatus" AS ENUM ('DETECTED', 'ENRICHED', 'MATCHED', 'READY_FOR_REVIEW', 'PUBLISHED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "MatchConfidence" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EXACT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PriceRuleScope" AS ENUM ('GLOBAL', 'CATEGORY', 'BRAND', 'PRODUCT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ImageSourcePriority" AS ENUM ('MANUFACTURER', 'DISTRIBUTOR', 'APPROVED_RETAILER', 'SUPPLIER', 'MANUAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "ProductSourceStatus" ADD VALUE IF NOT EXISTS 'NEEDS_ATTENTION'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DiscoveryStatus" AS ENUM ('NEW', 'EXISTING', 'DUPLICATE', 'NEEDS_ATTENTION', 'APPROVED', 'PUBLISHED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "QualityCheckStatus" AS ENUM ('PASSED', 'NEEDS_ATTENTION', 'FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "Manufacturer" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "website" TEXT,
  "country" "SourceCountry" NOT NULL DEFAULT 'INTERNATIONAL',
  "priority" INTEGER NOT NULL DEFAULT 100,
  "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Manufacturer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Supplier" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "country" "SourceCountry" NOT NULL DEFAULT 'KENYA',
  "contactName" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "website" TEXT,
  "status" "IntegrationStatus" NOT NULL DEFAULT 'INACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DataSource" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "DataSourceType" NOT NULL,
  "connectionType" "ConnectionType" NOT NULL,
  "country" "SourceCountry" NOT NULL DEFAULT 'INTERNATIONAL',
  "updateFrequency" "UpdateFrequency" NOT NULL DEFAULT 'DAILY',
  "status" "IntegrationStatus" NOT NULL DEFAULT 'INACTIVE',
  "baseUrl" TEXT,
  "contactEmail" TEXT,
  "notes" TEXT,
  "manufacturerId" TEXT,
  "supplierId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProductSource" (
  "id" TEXT NOT NULL,
  "productId" TEXT,
  "dataSourceId" TEXT NOT NULL,
  "manufacturerId" TEXT,
  "sourceProductId" TEXT,
  "sourceUrl" TEXT,
  "name" TEXT NOT NULL,
  "modelNumber" TEXT,
  "sku" TEXT,
  "barcode" TEXT,
  "brand" TEXT NOT NULL,
  "categoryName" TEXT,
  "description" TEXT,
  "specifications" JSONB,
  "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "datasheetUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "warrantyInfo" TEXT,
  "rawData" JSONB,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "seoKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" "ProductSourceStatus" NOT NULL DEFAULT 'DETECTED',
  "imageVerified" BOOLEAN NOT NULL DEFAULT false,
  "createdProduct" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SupplierProduct" (
  "id" TEXT NOT NULL,
  "productId" TEXT,
  "supplierId" TEXT,
  "dataSourceId" TEXT,
  "supplierSku" TEXT,
  "modelNumber" TEXT,
  "name" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "costPrice" DECIMAL(12,2),
  "distributorPrice" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'KES',
  "availableQuantity" INTEGER,
  "leadTimeDays" INTEGER,
  "warrantyInfo" TEXT,
  "rawData" JSONB,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupplierProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProductMatch" (
  "id" TEXT NOT NULL,
  "productSourceId" TEXT NOT NULL,
  "primaryProductId" TEXT,
  "candidateProductId" TEXT,
  "confidence" "MatchConfidence" NOT NULL DEFAULT 'MEDIUM',
  "score" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "matchedOn" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductMatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PriceHistory" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "costPrice" DECIMAL(12,2),
  "marketPrice" DECIMAL(12,2),
  "recommendedPrice" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'KES',
  "exchangeRate" DECIMAL(12,4),
  "operatingCostAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "targetMarginPercent" DECIMAL(5,2) NOT NULL,
  "kenyaMarketAdjustment" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MarketPriceIndex" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "averageKenyaPrice" DECIMAL(12,2) NOT NULL,
  "lowestMarketPrice" DECIMAL(12,2) NOT NULL,
  "highestMarketPrice" DECIMAL(12,2) NOT NULL,
  "recommendedCeterPrice" DECIMAL(12,2) NOT NULL,
  "sampleSize" INTEGER NOT NULL DEFAULT 0,
  "sources" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketPriceIndex_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PriceRule" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "scope" "PriceRuleScope" NOT NULL DEFAULT 'GLOBAL',
  "categoryId" TEXT,
  "brand" TEXT,
  "productId" TEXT,
  "targetMarginPercent" DECIMAL(5,2) NOT NULL,
  "operatingCostPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "kenyaAdjustmentPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "minimumMarginAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PriceRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InventoryLog" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "supplierProductId" TEXT,
  "warehouseQuantity" INTEGER NOT NULL DEFAULT 0,
  "supplierQuantity" INTEGER NOT NULL DEFAULT 0,
  "availableQuantity" INTEGER NOT NULL DEFAULT 0,
  "restockRecommended" BOOLEAN NOT NULL DEFAULT false,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AutomationJob" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "AutomationJobType" NOT NULL,
  "status" "AutomationJobStatus" NOT NULL DEFAULT 'QUEUED',
  "dataSourceId" TEXT,
  "schedule" TEXT,
  "recordsRead" INTEGER NOT NULL DEFAULT 0,
  "productsCreated" INTEGER NOT NULL DEFAULT 0,
  "imagesCollected" INTEGER NOT NULL DEFAULT 0,
  "pricesUpdated" INTEGER NOT NULL DEFAULT 0,
  "failedRecords" INTEGER NOT NULL DEFAULT 0,
  "missingInfo" JSONB,
  "opportunities" JSONB,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AutomationJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProductDiscovery" (
  "id" TEXT NOT NULL,
  "productSourceId" TEXT,
  "productId" TEXT,
  "dataSourceId" TEXT,
  "detectedName" TEXT NOT NULL,
  "detectedBrand" TEXT,
  "detectedCategory" TEXT,
  "confidenceScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "status" "DiscoveryStatus" NOT NULL DEFAULT 'NEW',
  "notes" TEXT,
  "evidence" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductDiscovery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProductQualityCheck" (
  "id" TEXT NOT NULL,
  "productId" TEXT,
  "productSourceId" TEXT,
  "status" "QualityCheckStatus" NOT NULL DEFAULT 'NEEDS_ATTENTION',
  "hasName" BOOLEAN NOT NULL DEFAULT false,
  "hasBrand" BOOLEAN NOT NULL DEFAULT false,
  "hasCategory" BOOLEAN NOT NULL DEFAULT false,
  "hasImage" BOOLEAN NOT NULL DEFAULT false,
  "hasSpecifications" BOOLEAN NOT NULL DEFAULT false,
  "hasPrice" BOOLEAN NOT NULL DEFAULT false,
  "issues" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductQualityCheck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AutomationLog" (
  "id" TEXT NOT NULL,
  "automationJobId" TEXT,
  "dataSourceId" TEXT,
  "level" TEXT NOT NULL DEFAULT 'info',
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomationLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ImageSource" (
  "id" TEXT NOT NULL,
  "productId" TEXT,
  "productSourceId" TEXT,
  "dataSourceId" TEXT,
  "url" TEXT NOT NULL,
  "storageUrl" TEXT,
  "source" "ImageSourcePriority" NOT NULL,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImageSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CatalogueImport" (
  "id" TEXT NOT NULL,
  "dataSourceId" TEXT,
  "fileName" TEXT NOT NULL,
  "fileType" "ConnectionType" NOT NULL,
  "status" "AutomationJobStatus" NOT NULL DEFAULT 'QUEUED',
  "totalRows" INTEGER NOT NULL DEFAULT 0,
  "detectedProducts" INTEGER NOT NULL DEFAULT 0,
  "createdProducts" INTEGER NOT NULL DEFAULT 0,
  "matchedProducts" INTEGER NOT NULL DEFAULT 0,
  "failedRows" INTEGER NOT NULL DEFAULT 0,
  "errorReport" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogueImport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Manufacturer_name_key" ON "Manufacturer"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Manufacturer_slug_key" ON "Manufacturer"("slug");
CREATE INDEX IF NOT EXISTS "Manufacturer_priority_idx" ON "Manufacturer"("priority");
CREATE UNIQUE INDEX IF NOT EXISTS "Supplier_name_key" ON "Supplier"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Supplier_slug_key" ON "Supplier"("slug");
CREATE INDEX IF NOT EXISTS "Supplier_status_idx" ON "Supplier"("status");

CREATE INDEX IF NOT EXISTS "DataSource_type_idx" ON "DataSource"("type");
CREATE INDEX IF NOT EXISTS "DataSource_connectionType_idx" ON "DataSource"("connectionType");
CREATE INDEX IF NOT EXISTS "DataSource_status_idx" ON "DataSource"("status");
CREATE INDEX IF NOT EXISTS "DataSource_updateFrequency_idx" ON "DataSource"("updateFrequency");

CREATE INDEX IF NOT EXISTS "ProductSource_productId_idx" ON "ProductSource"("productId");
CREATE INDEX IF NOT EXISTS "ProductSource_dataSourceId_idx" ON "ProductSource"("dataSourceId");
CREATE INDEX IF NOT EXISTS "ProductSource_manufacturerId_idx" ON "ProductSource"("manufacturerId");
CREATE INDEX IF NOT EXISTS "ProductSource_brand_idx" ON "ProductSource"("brand");
CREATE INDEX IF NOT EXISTS "ProductSource_modelNumber_idx" ON "ProductSource"("modelNumber");
CREATE INDEX IF NOT EXISTS "ProductSource_sku_idx" ON "ProductSource"("sku");
CREATE INDEX IF NOT EXISTS "ProductSource_status_idx" ON "ProductSource"("status");

CREATE INDEX IF NOT EXISTS "SupplierProduct_productId_idx" ON "SupplierProduct"("productId");
CREATE INDEX IF NOT EXISTS "SupplierProduct_supplierId_idx" ON "SupplierProduct"("supplierId");
CREATE INDEX IF NOT EXISTS "SupplierProduct_dataSourceId_idx" ON "SupplierProduct"("dataSourceId");
CREATE INDEX IF NOT EXISTS "SupplierProduct_supplierSku_idx" ON "SupplierProduct"("supplierSku");
CREATE INDEX IF NOT EXISTS "SupplierProduct_modelNumber_idx" ON "SupplierProduct"("modelNumber");

CREATE INDEX IF NOT EXISTS "ProductMatch_productSourceId_idx" ON "ProductMatch"("productSourceId");
CREATE INDEX IF NOT EXISTS "ProductMatch_primaryProductId_idx" ON "ProductMatch"("primaryProductId");
CREATE INDEX IF NOT EXISTS "ProductMatch_candidateProductId_idx" ON "ProductMatch"("candidateProductId");
CREATE INDEX IF NOT EXISTS "ProductMatch_confidence_idx" ON "ProductMatch"("confidence");

CREATE INDEX IF NOT EXISTS "PriceHistory_productId_idx" ON "PriceHistory"("productId");
CREATE INDEX IF NOT EXISTS "PriceHistory_createdAt_idx" ON "PriceHistory"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "MarketPriceIndex_productId_key" ON "MarketPriceIndex"("productId");
CREATE INDEX IF NOT EXISTS "MarketPriceIndex_updatedAt_idx" ON "MarketPriceIndex"("updatedAt");

CREATE INDEX IF NOT EXISTS "PriceRule_scope_idx" ON "PriceRule"("scope");
CREATE INDEX IF NOT EXISTS "PriceRule_categoryId_idx" ON "PriceRule"("categoryId");
CREATE INDEX IF NOT EXISTS "PriceRule_brand_idx" ON "PriceRule"("brand");
CREATE INDEX IF NOT EXISTS "PriceRule_productId_idx" ON "PriceRule"("productId");
CREATE INDEX IF NOT EXISTS "PriceRule_isActive_idx" ON "PriceRule"("isActive");

CREATE INDEX IF NOT EXISTS "InventoryLog_productId_idx" ON "InventoryLog"("productId");
CREATE INDEX IF NOT EXISTS "InventoryLog_supplierProductId_idx" ON "InventoryLog"("supplierProductId");
CREATE INDEX IF NOT EXISTS "InventoryLog_createdAt_idx" ON "InventoryLog"("createdAt");

CREATE INDEX IF NOT EXISTS "AutomationJob_type_idx" ON "AutomationJob"("type");
CREATE INDEX IF NOT EXISTS "AutomationJob_status_idx" ON "AutomationJob"("status");
CREATE INDEX IF NOT EXISTS "AutomationJob_dataSourceId_idx" ON "AutomationJob"("dataSourceId");
CREATE INDEX IF NOT EXISTS "AutomationJob_createdAt_idx" ON "AutomationJob"("createdAt");

CREATE INDEX IF NOT EXISTS "ProductDiscovery_productSourceId_idx" ON "ProductDiscovery"("productSourceId");
CREATE INDEX IF NOT EXISTS "ProductDiscovery_productId_idx" ON "ProductDiscovery"("productId");
CREATE INDEX IF NOT EXISTS "ProductDiscovery_dataSourceId_idx" ON "ProductDiscovery"("dataSourceId");
CREATE INDEX IF NOT EXISTS "ProductDiscovery_status_idx" ON "ProductDiscovery"("status");
CREATE INDEX IF NOT EXISTS "ProductDiscovery_detectedBrand_idx" ON "ProductDiscovery"("detectedBrand");

CREATE INDEX IF NOT EXISTS "ProductQualityCheck_productId_idx" ON "ProductQualityCheck"("productId");
CREATE INDEX IF NOT EXISTS "ProductQualityCheck_productSourceId_idx" ON "ProductQualityCheck"("productSourceId");
CREATE INDEX IF NOT EXISTS "ProductQualityCheck_status_idx" ON "ProductQualityCheck"("status");
CREATE INDEX IF NOT EXISTS "ProductQualityCheck_checkedAt_idx" ON "ProductQualityCheck"("checkedAt");

CREATE INDEX IF NOT EXISTS "AutomationLog_automationJobId_idx" ON "AutomationLog"("automationJobId");
CREATE INDEX IF NOT EXISTS "AutomationLog_dataSourceId_idx" ON "AutomationLog"("dataSourceId");
CREATE INDEX IF NOT EXISTS "AutomationLog_level_idx" ON "AutomationLog"("level");
CREATE INDEX IF NOT EXISTS "AutomationLog_createdAt_idx" ON "AutomationLog"("createdAt");

CREATE INDEX IF NOT EXISTS "ImageSource_productId_idx" ON "ImageSource"("productId");
CREATE INDEX IF NOT EXISTS "ImageSource_productSourceId_idx" ON "ImageSource"("productSourceId");
CREATE INDEX IF NOT EXISTS "ImageSource_dataSourceId_idx" ON "ImageSource"("dataSourceId");
CREATE INDEX IF NOT EXISTS "ImageSource_source_idx" ON "ImageSource"("source");
CREATE INDEX IF NOT EXISTS "ImageSource_isVerified_idx" ON "ImageSource"("isVerified");

CREATE INDEX IF NOT EXISTS "CatalogueImport_dataSourceId_idx" ON "CatalogueImport"("dataSourceId");
CREATE INDEX IF NOT EXISTS "CatalogueImport_status_idx" ON "CatalogueImport"("status");
CREATE INDEX IF NOT EXISTS "CatalogueImport_createdAt_idx" ON "CatalogueImport"("createdAt");

ALTER TABLE "DataSource" ADD CONSTRAINT "DataSource_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DataSource" ADD CONSTRAINT "DataSource_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductSource" ADD CONSTRAINT "ProductSource_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductSource" ADD CONSTRAINT "ProductSource_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSource" ADD CONSTRAINT "ProductSource_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductMatch" ADD CONSTRAINT "ProductMatch_productSourceId_fkey" FOREIGN KEY ("productSourceId") REFERENCES "ProductSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductMatch" ADD CONSTRAINT "ProductMatch_primaryProductId_fkey" FOREIGN KEY ("primaryProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductMatch" ADD CONSTRAINT "ProductMatch_candidateProductId_fkey" FOREIGN KEY ("candidateProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketPriceIndex" ADD CONSTRAINT "MarketPriceIndex_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomationJob" ADD CONSTRAINT "AutomationJob_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductDiscovery" ADD CONSTRAINT "ProductDiscovery_productSourceId_fkey" FOREIGN KEY ("productSourceId") REFERENCES "ProductSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductDiscovery" ADD CONSTRAINT "ProductDiscovery_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductDiscovery" ADD CONSTRAINT "ProductDiscovery_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductQualityCheck" ADD CONSTRAINT "ProductQualityCheck_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductQualityCheck" ADD CONSTRAINT "ProductQualityCheck_productSourceId_fkey" FOREIGN KEY ("productSourceId") REFERENCES "ProductSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AutomationLog" ADD CONSTRAINT "AutomationLog_automationJobId_fkey" FOREIGN KEY ("automationJobId") REFERENCES "AutomationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomationLog" ADD CONSTRAINT "AutomationLog_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ImageSource" ADD CONSTRAINT "ImageSource_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ImageSource" ADD CONSTRAINT "ImageSource_productSourceId_fkey" FOREIGN KEY ("productSourceId") REFERENCES "ProductSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ImageSource" ADD CONSTRAINT "ImageSource_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CatalogueImport" ADD CONSTRAINT "CatalogueImport_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
