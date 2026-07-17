-- Admin ERP revamp: extend existing catalogue, category, supplier, and campaign models.
ALTER TABLE "Category"
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "seoTitle" TEXT,
ADD COLUMN "seoDescription" TEXT;

ALTER TABLE "Product"
ADD COLUMN "sku" TEXT,
ADD COLUMN "costPrice" DECIMAL(12,2),
ADD COLUMN "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 16,
ADD COLUMN "supplierId" TEXT,
ADD COLUMN "warehouseLocation" TEXT,
ADD COLUMN "imageFolder" TEXT,
ADD COLUMN "homepagePlacement" TEXT;

ALTER TABLE "MarketingCampaign"
ADD COLUMN "campaignType" TEXT NOT NULL DEFAULT 'PRODUCT_PROMOTION';

CREATE TABLE "MarketingCampaignCategory" (
    "campaignId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "MarketingCampaignCategory_pkey" PRIMARY KEY ("campaignId","categoryId")
);

CREATE INDEX "Category_parentId_sortOrder_idx" ON "Category"("parentId", "sortOrder");
CREATE INDEX "Product_sku_idx" ON "Product"("sku");
CREATE INDEX "Product_supplierId_idx" ON "Product"("supplierId");
CREATE INDEX "MarketingCampaign_campaignType_idx" ON "MarketingCampaign"("campaignType");
CREATE INDEX "MarketingCampaignCategory_categoryId_idx" ON "MarketingCampaignCategory"("categoryId");

ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketingCampaignCategory" ADD CONSTRAINT "MarketingCampaignCategory_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketingCampaignCategory" ADD CONSTRAINT "MarketingCampaignCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
