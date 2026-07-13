"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { logAudit, requirePermission } from "@/lib/rbac";
import {
  MEDIA_BUCKETS,
  bucketFromForm,
  deleteMediaObject,
  fileNameFromUrl,
  folderFromForm,
  inferMediaType,
  storagePathFromPublicUrl,
  uploadMediaFile,
} from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { runProductDiscoveryEngine } from "@/lib/product-discovery";
import { runBulkImageAutomation } from "@/lib/services/imageAutomation";

const productStatuses = ["ACTIVE", "OUT_OF_STOCK", "DRAFT", "NEEDS_ATTENTION"] as const;
const orderStatuses = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
const deliveryStatuses = [
  "PENDING",
  "READY_FOR_DISPATCH",
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED",
  "RETURNED",
] as const;
const productBadges = ["FEATURED", "NEW_ARRIVAL", "BEST_SELLER", "PROMOTION"] as const;
const campaignStatuses = ["DRAFT", "ACTIVE", "PAUSED", "EXPIRED"] as const;
const dataSourceTypes = ["MANUFACTURER", "SUPPLIER", "DISTRIBUTOR", "RETAILER"] as const;
const connectionTypes = ["API", "EXCEL", "CSV", "XML", "JSON", "WEB_CATALOGUE"] as const;
const sourceCountries = ["KENYA", "INTERNATIONAL"] as const;
const updateFrequencies = ["HOURLY", "DAILY", "WEEKLY", "MONTHLY"] as const;
const integrationStatuses = ["ACTIVE", "INACTIVE"] as const;
const automationJobTypes = [
  "MANUFACTURER_SYNC",
  "SUPPLIER_SYNC",
  "CATALOGUE_IMPORT",
  "IMAGE_COLLECTION",
  "SPEC_EXTRACTION",
  "PRODUCT_ENRICHMENT",
  "PRICE_UPDATE",
  "MARKET_PRICE_CHECK",
  "INVENTORY_UPDATE",
  "SEO_GENERATION",
  "MARKETING_ANALYSIS",
  "BUSINESS_REPORT",
] as const;
const priceRuleScopes = ["GLOBAL", "CATEGORY", "BRAND", "PRODUCT"] as const;
const quoteStatuses = ["NEW", "CONTACTED", "QUOTED", "CLOSED"] as const;

type BulkProductSnapshot = {
  id: string;
  name: string;
  price: { toString(): string };
  stock: number;
  status: string;
};

function hasNoJsonObjectEntries(value: unknown) {
  return !value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length === 0;
}

const priorityManufacturers = [
  { name: "HP", categories: ["Printers", "Computers"] },
  { name: "Canon", categories: ["Printers"] },
  { name: "Epson", categories: ["Printers"] },
  { name: "Brother", categories: ["Printers"] },
  { name: "Kyocera", categories: ["Printers"] },
  { name: "Zebra", categories: ["Printers"] },
  { name: "Xerox", categories: ["Printers"] },
  { name: "Ricoh", categories: ["Printers"] },
  { name: "Dell", categories: ["Computers"] },
  { name: "Lenovo", categories: ["Computers"] },
  { name: "Asus", categories: ["Computers"] },
  { name: "Acer", categories: ["Computers"] },
  { name: "TP-Link", categories: ["Networking"] },
  { name: "Cisco", categories: ["Networking"] },
  { name: "Ubiquiti", categories: ["Networking"] },
  { name: "Mikrotik", categories: ["Networking"] },
  { name: "D-Link", categories: ["Networking"] },
  { name: "Kingston", categories: ["Storage"] },
  { name: "Samsung", categories: ["Storage"] },
  { name: "Seagate", categories: ["Storage"] },
  { name: "Western Digital", categories: ["Storage"] },
  { name: "APC", categories: ["Power"] },
  { name: "Eaton", categories: ["Power"] },
];

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required.`);
  }

  return value.trim();
}

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function requiredNumber(formData: FormData, key: string) {
  const value = Number(requiredString(formData, key));

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${key} must be a valid positive number.`);
  }

  return value;
}

function decimalString(formData: FormData, key: string, options: { required?: boolean; min?: number; max: number }) {
  const rawValue = options.required ? requiredString(formData, key) : optionalString(formData, key) ?? "0";
  const value = Number(rawValue);
  const min = options.min ?? 0;

  if (!Number.isFinite(value) || value < min || value > options.max) {
    throw new Error(`${key} must be between ${min} and ${options.max}.`);
  }

  return value.toFixed(2);
}

function requiredDate(formData: FormData, key: string) {
  const value = new Date(requiredString(formData, key));

  if (Number.isNaN(value.getTime())) {
    throw new Error(`${key} must be a valid date.`);
  }

  return value;
}

function optionalDate(formData: FormData, key: string) {
  const value = optionalString(formData, key);

  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${key} must be a valid date.`);
  }

  return date;
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || crypto.randomUUID()
  );
}

async function uniqueSlug(model: "category" | "product", value: string, id?: string) {
  const base = slugify(value);
  let slug = base;
  let index = 2;

  while (true) {
    const match =
      model === "category"
        ? await prisma.category.findUnique({ where: { slug } })
        : await prisma.product.findUnique({ where: { slug } });

    if (!match || match.id === id) {
      return slug;
    }

    slug = `${base}-${index}`;
    index += 1;
  }
}

function parseSpecifications(value: string | null) {
  if (!value) {
    return undefined;
  }

  return Object.fromEntries(
    value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [key, ...rest] = line.split(":");
        return [key.trim(), rest.join(":").trim()];
      })
      .filter(([key, value]) => key && value),
  );
}

function assertProductStatus(value: string) {
  if (!productStatuses.includes(value as (typeof productStatuses)[number])) {
    throw new Error("Invalid product status.");
  }

  return value as (typeof productStatuses)[number];
}

function assertOrderStatus(value: string) {
  if (!orderStatuses.includes(value as (typeof orderStatuses)[number])) {
    throw new Error("Invalid order status.");
  }

  return value as (typeof orderStatuses)[number];
}

function assertDeliveryStatus(value: string) {
  if (!deliveryStatuses.includes(value as (typeof deliveryStatuses)[number])) {
    throw new Error("Invalid delivery status.");
  }

  return value as (typeof deliveryStatuses)[number];
}

function assertCampaignStatus(value: string) {
  if (!campaignStatuses.includes(value as (typeof campaignStatuses)[number])) {
    throw new Error("Invalid campaign status.");
  }

  return value as (typeof campaignStatuses)[number];
}

function assertDataSourceType(value: string) {
  if (!dataSourceTypes.includes(value as (typeof dataSourceTypes)[number])) {
    throw new Error("Invalid data source type.");
  }

  return value as (typeof dataSourceTypes)[number];
}

function assertConnectionType(value: string) {
  if (!connectionTypes.includes(value as (typeof connectionTypes)[number])) {
    throw new Error("Invalid connection type.");
  }

  return value as (typeof connectionTypes)[number];
}

function assertSourceCountry(value: string) {
  if (!sourceCountries.includes(value as (typeof sourceCountries)[number])) {
    throw new Error("Invalid source country.");
  }

  return value as (typeof sourceCountries)[number];
}

function assertUpdateFrequency(value: string) {
  if (!updateFrequencies.includes(value as (typeof updateFrequencies)[number])) {
    throw new Error("Invalid update frequency.");
  }

  return value as (typeof updateFrequencies)[number];
}

function assertIntegrationStatus(value: string) {
  if (!integrationStatuses.includes(value as (typeof integrationStatuses)[number])) {
    throw new Error("Invalid integration status.");
  }

  return value as (typeof integrationStatuses)[number];
}

function assertAutomationJobType(value: string) {
  if (!automationJobTypes.includes(value as (typeof automationJobTypes)[number])) {
    throw new Error("Invalid automation job type.");
  }

  return value as (typeof automationJobTypes)[number];
}

function assertPriceRuleScope(value: string) {
  if (!priceRuleScopes.includes(value as (typeof priceRuleScopes)[number])) {
    throw new Error("Invalid price rule scope.");
  }

  return value as (typeof priceRuleScopes)[number];
}

function assertQuoteStatus(value: string) {
  if (!quoteStatuses.includes(value as (typeof quoteStatuses)[number])) {
    throw new Error("Invalid quote request status.");
  }

  return value;
}

function badgesFromForm(formData: FormData) {
  return formData
    .getAll("badges")
    .filter((value): value is (typeof productBadges)[number] => {
      return typeof value === "string" && productBadges.includes(value as (typeof productBadges)[number]);
    });
}

function externalMediaData(url: string, productId?: string | null) {
  const fileType = url.match(/\.(mp4|mov|webm)(\?|$)/i) ? "video/external" : "image/external";

  return {
    productId: productId || null,
    url,
    fileName: fileNameFromUrl(url),
    fileType,
    fileSize: 0,
    storagePath: storagePathFromPublicUrl(url),
    type: inferMediaType(fileType),
  };
}

function productFolderFromForm(formData: FormData) {
  const value = formData.get("imageFolder");

  if (value === "accessories" || value === "office-equipment" || value === "printers") {
    return value;
  }

  return "printers";
}

async function uploadImagesFromForm(formData: FormData, key: string, productId?: string) {
  const files = formData.getAll(key);
  const media = [];
  const folder = productFolderFromForm(formData);

  for (const file of files) {
    if (file instanceof File && file.size > 0) {
      const uploaded = await uploadMediaFile({
        file,
        bucket: MEDIA_BUCKETS.productImages,
        folder,
        productId,
      });

      if (uploaded) {
        media.push(uploaded);
      }
    }
  }

  return media;
}

async function uploadWebsiteImageFromForm(
  formData: FormData,
  key: string,
  folder: "banners" | "brands" | "promotions",
) {
  const file = formData.get(key);

  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  return uploadMediaFile({
    file,
    bucket: MEDIA_BUCKETS.websiteMedia,
    folder,
  });
}

async function logAdminAction(adminId: string, action: string) {
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { name: true },
  });

  await prisma.adminLog.create({
    data: {
      adminId,
      action,
    },
  });

  await logAudit({
    actorId: adminId,
    actorName: admin?.name,
    action,
    module: "admin",
  });
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/automation");
  revalidatePath("/admin/data-sources");
  revalidatePath("/admin/marketing");
  revalidatePath("/admin/product-ai");
  revalidatePath("/admin/products");
  revalidatePath("/admin/media");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/homepage");
}

function revalidateHomepage() {
  revalidatePath("/");
  revalidateAdmin();
}

export async function createDataSource(formData: FormData) {
  const admin = await requirePermission("PRODUCTS", "EDIT");
  const name = requiredString(formData, "name");
  const manufacturerId = optionalString(formData, "manufacturerId");
  const supplierId = optionalString(formData, "supplierId");

  const dataSource = await prisma.dataSource.create({
    data: {
      name,
      type: assertDataSourceType(requiredString(formData, "type")),
      connectionType: assertConnectionType(requiredString(formData, "connectionType")),
      country: assertSourceCountry(requiredString(formData, "country")),
      updateFrequency: assertUpdateFrequency(requiredString(formData, "updateFrequency")),
      status: assertIntegrationStatus(requiredString(formData, "status")),
      baseUrl: optionalString(formData, "baseUrl"),
      contactEmail: optionalString(formData, "contactEmail"),
      notes: optionalString(formData, "notes"),
      manufacturerId,
      supplierId,
    },
  });

  await logAdminAction(admin.id, `Created data source: ${dataSource.name}`);
  revalidateAdmin();
}

export async function updateDataSource(formData: FormData) {
  const admin = await requirePermission("PRODUCTS", "EDIT");
  const dataSourceId = requiredString(formData, "dataSourceId");
  const dataSource = await prisma.dataSource.update({
    where: { id: dataSourceId },
    data: {
      name: requiredString(formData, "name"),
      type: assertDataSourceType(requiredString(formData, "type")),
      connectionType: assertConnectionType(requiredString(formData, "connectionType")),
      country: assertSourceCountry(requiredString(formData, "country")),
      updateFrequency: assertUpdateFrequency(requiredString(formData, "updateFrequency")),
      status: assertIntegrationStatus(requiredString(formData, "status")),
      baseUrl: optionalString(formData, "baseUrl"),
      contactEmail: optionalString(formData, "contactEmail"),
      notes: optionalString(formData, "notes"),
      manufacturerId: optionalString(formData, "manufacturerId"),
      supplierId: optionalString(formData, "supplierId"),
    },
  });

  await logAdminAction(admin.id, `Updated data source: ${dataSource.name}`);
  revalidateAdmin();
}

export async function deleteDataSource(formData: FormData) {
  const admin = await requirePermission("PRODUCTS", "EDIT");
  const dataSourceId = requiredString(formData, "dataSourceId");
  const dataSource = await prisma.dataSource.delete({ where: { id: dataSourceId } });

  await logAdminAction(admin.id, `Deleted data source: ${dataSource.name}`);
  revalidateAdmin();
}

export async function createSupplier(formData: FormData) {
  const admin = await requirePermission("PRODUCTS", "EDIT");
  const name = requiredString(formData, "name");
  const supplier = await prisma.supplier.create({
    data: {
      name,
      slug: slugify(name),
      country: assertSourceCountry(requiredString(formData, "country")),
      contactName: optionalString(formData, "contactName"),
      email: optionalString(formData, "email"),
      phone: optionalString(formData, "phone"),
      website: optionalString(formData, "website"),
      status: assertIntegrationStatus(requiredString(formData, "status")),
    },
  });

  await logAdminAction(admin.id, `Created supplier: ${supplier.name}`);
  revalidateAdmin();
}

export async function bootstrapPriorityManufacturers() {
  const admin = await requirePermission("PRODUCTS", "EDIT");

  for (const [index, manufacturer] of priorityManufacturers.entries()) {
    await prisma.manufacturer.upsert({
      where: { name: manufacturer.name },
      update: {
        categories: manufacturer.categories,
        priority: index + 1,
      },
      create: {
        name: manufacturer.name,
        slug: slugify(manufacturer.name),
        categories: manufacturer.categories,
        priority: index + 1,
      },
    });
  }

  await logAdminAction(admin.id, "Bootstrapped priority manufacturer connectors");
  revalidateAdmin();
}

export async function createPriceRule(formData: FormData) {
  const admin = await requirePermission("PRODUCTS", "EDIT");
  const scope = assertPriceRuleScope(requiredString(formData, "scope"));
  const targetMarginPercent = decimalString(formData, "targetMarginPercent", { required: true, max: 999.99 });
  const operatingCostPercent = decimalString(formData, "operatingCostPercent", { max: 999.99 });
  const kenyaAdjustmentPercent = decimalString(formData, "kenyaAdjustmentPercent", { min: -999.99, max: 999.99 });
  const minimumMarginAmount = decimalString(formData, "minimumMarginAmount", { max: 9_999_999_999.99 });
  const rule = await prisma.priceRule.create({
    data: {
      name: requiredString(formData, "name"),
      scope,
      categoryId: scope === "CATEGORY" ? optionalString(formData, "categoryId") : null,
      brand: scope === "BRAND" ? optionalString(formData, "brand") : null,
      productId: scope === "PRODUCT" ? optionalString(formData, "productId") : null,
      targetMarginPercent,
      operatingCostPercent,
      kenyaAdjustmentPercent,
      minimumMarginAmount,
      isActive: formData.get("isActive") === "on",
    },
  });

  await logAdminAction(admin.id, `Created price rule: ${rule.name}`);
  revalidateAdmin();
}

export async function runAutomationJob(formData: FormData) {
  const admin = await requirePermission("PRODUCTS", "EDIT");
  const type = assertAutomationJobType(requiredString(formData, "type"));
  const dataSourceId = optionalString(formData, "dataSourceId");
  const dataSource = dataSourceId
    ? await prisma.dataSource.findUnique({ where: { id: dataSourceId } })
    : null;

  const [detectedProducts, productsWithoutImages, activeProducts, lowStockProducts, duplicateMatches, missingSpecs] = await Promise.all([
    prisma.productSource.count({ where: dataSourceId ? { dataSourceId } : undefined }),
    prisma.productSource.count({
      where: {
        ...(dataSourceId ? { dataSourceId } : {}),
        imageVerified: false,
      },
    }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.product.count({
      where: {
        stock: { lte: 5 },
      },
    }),
    prisma.productMatch.count(),
    prisma.productSource.findMany({
      where: dataSourceId ? { dataSourceId } : undefined,
      select: { specifications: true },
    }),
  ]);
  const productsWithoutSpecifications = missingSpecs.filter((source: { specifications: unknown }) =>
    hasNoJsonObjectEntries(source.specifications),
  ).length;
  const schedule =
    type === "MANUFACTURER_SYNC"
      ? "Daily"
      : type === "PRODUCT_ENRICHMENT"
        ? "Weekly"
        : type === "CATALOGUE_IMPORT"
          ? "Monthly"
          : type === "BUSINESS_REPORT"
            ? "Monthly"
            : type.includes("PRICE")
              ? "Daily"
              : "Weekly";

  const job = await prisma.automationJob.create({
    data: {
      name: `${type.replaceAll("_", " ").toLowerCase()}${dataSource ? ` - ${dataSource.name}` : ""}`,
      type,
      status: "COMPLETED",
      dataSourceId,
      schedule,
      recordsRead: detectedProducts,
      productsCreated: 0,
      imagesCollected: Math.max(0, detectedProducts - productsWithoutImages),
      pricesUpdated: type.includes("PRICE") ? activeProducts : 0,
      failedRecords: productsWithoutImages,
      missingInfo: {
        productsWithoutVerifiedImages: productsWithoutImages,
        productsWithoutSpecifications,
        duplicateMatches,
        rule: "Automated publication is blocked until duplicate checks, images, category, and specifications are reviewable.",
      },
      opportunities: {
        lowStockProducts,
        duplicateCleanupCandidates: type === "CATALOGUE_IMPORT" ? duplicateMatches : 0,
        recommendedAction:
          type === "MANUFACTURER_SYNC"
            ? "Review newly detected product sources"
            : type === "PRODUCT_ENRICHMENT"
              ? "Refresh manufacturer source records and fill missing specifications"
              : type === "CATALOGUE_IMPORT"
                ? "Review duplicate matches before merging products"
                : lowStockProducts > 0
                  ? "Review replenishment candidates"
                  : "No immediate stock action",
      },
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });

  await logAdminAction(admin.id, `Ran automation job: ${job.name}`);
  revalidateAdmin();

  return {
    title: "Automation job completed",
    message: `${job.name} finished successfully.`,
    metrics: [
      { label: "Records read", value: detectedProducts },
      { label: "Images ready", value: Math.max(0, detectedProducts - productsWithoutImages) },
      { label: "Prices updated", value: type.includes("PRICE") ? activeProducts : 0 },
    ],
  };
}

export async function syncMarketplace() {
  const admin = await requirePermission("PRODUCTS", "EDIT");
  const startedAt = new Date();
  const job = await prisma.automationJob.create({
    data: {
      name: "sync marketplace",
      type: "MANUFACTURER_SYNC",
      status: "RUNNING",
      schedule: "On demand",
      startedAt,
    },
  });

  try {
    const result = await runProductDiscoveryEngine(prisma);
    const failedRecords = result.errors.length;
    const imageResult = await runBulkImageAutomation({ limit: 500 });
    const totalFailedRecords = failedRecords + imageResult.errors;
    const totalImagesCollected = result.imagesCollected + imageResult.imagesCollected;

    await prisma.automationJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        progress: 100,
        totalItems: result.productsDiscovered,
        completedItems: result.productsDiscovered,
        errors: totalFailedRecords,
        recordsRead: result.productsDiscovered,
        productsCreated: result.productsCreated,
        imagesCollected: totalImagesCollected,
        pricesUpdated: result.pricesUpdated,
        failedRecords: totalFailedRecords,
        missingInfo: {
          errors: result.errors,
          imageErrors: imageResult.results.filter((item) => !item.ok),
          qualityGate: "Products are created only when public source data includes image, category, specifications, and Kenya price evidence.",
        },
        opportunities: {
          sourcesChecked: result.sourcesChecked,
          productsDiscovered: result.productsDiscovered,
          productsUpdated: result.productsUpdated,
          productsCreated: result.productsCreated,
          imagesCollected: totalImagesCollected,
          pricesUpdated: result.pricesUpdated,
        },
        completedAt: new Date(),
        finishedAt: new Date(),
      },
    });

    await prisma.automationLog.create({
      data: {
        automationJobId: job.id,
        level: totalFailedRecords > 0 ? "warning" : "info",
        message: `Marketplace sync completed: ${result.sourcesChecked} sources checked, ${result.productsDiscovered} discovered, ${result.productsUpdated} updated, ${result.productsCreated} products created, ${totalImagesCollected} images collected, ${totalFailedRecords} errors.`,
        metadata: { ...result, imageAutomation: imageResult },
      },
    });

    await logAdminAction(admin.id, "Synced real product discovery marketplace pipeline");
    revalidateAdmin();
    revalidateCatalogue();

    return {
      title: "Marketplace Sync Completed",
      message: `${result.sourcesChecked} sources checked with ${totalFailedRecords} error${totalFailedRecords === 1 ? "" : "s"}.`,
      metrics: [
        { label: "Products discovered", value: result.productsDiscovered },
        { label: "Products updated", value: result.productsUpdated },
        { label: "Images collected", value: totalImagesCollected },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown marketplace sync error";

    await prisma.automationJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errors: 1,
        progress: 100,
        errorMessage: message,
        completedAt: new Date(),
        finishedAt: new Date(),
      },
    });
    await prisma.automationLog.create({
      data: {
        automationJobId: job.id,
        level: "error",
        message: `Marketplace sync failed: ${message}`,
      },
    });

    throw error;
  }
}

function revalidateCatalogue(slug?: string) {
  revalidateTag("catalogue", "max");
  revalidateTag("products", "max");
  revalidateTag("categories", "max");
  revalidatePath("/");
  revalidatePath("/products");

  if (slug) {
    revalidatePath(`/products/${slug}`);
  }
}

export async function createCategory(formData: FormData) {
  const admin = await requirePermission("CATEGORIES", "MANAGE");
  const name = requiredString(formData, "name");
  const slug = await uniqueSlug("category", optionalString(formData, "slug") ?? name);

  await prisma.category.create({
    data: {
      name,
      slug,
      description: optionalString(formData, "description"),
      parentId: optionalString(formData, "parentId"),
    },
  });

  await logAdminAction(admin.id, `Created category: ${name}`);
  revalidateAdmin();
  revalidateCatalogue();
}

export async function updateCategory(formData: FormData) {
  const admin = await requirePermission("CATEGORIES", "MANAGE");
  const categoryId = requiredString(formData, "categoryId");
  const name = requiredString(formData, "name");
  const parentId = optionalString(formData, "parentId");

  if (parentId === categoryId) {
    throw new Error("A category cannot be its own parent.");
  }

  const category = await prisma.category.update({
    where: { id: categoryId },
    data: {
      name,
      slug: await uniqueSlug("category", optionalString(formData, "slug") ?? name, categoryId),
      description: optionalString(formData, "description"),
      parentId,
    },
  });

  await logAdminAction(admin.id, `Updated category: ${category.name}`);
  revalidateAdmin();
  revalidateCatalogue();
}

export async function deleteCategory(formData: FormData) {
  const admin = await requirePermission("CATEGORIES", "MANAGE");
  const categoryId = requiredString(formData, "categoryId");
  const [productCount, childCount] = await Promise.all([
    prisma.product.count({ where: { categoryId } }),
    prisma.category.count({ where: { parentId: categoryId } }),
  ]);

  if (productCount > 0 || childCount > 0) {
    throw new Error("Move products and subcategories before deleting this category.");
  }

  const category = await prisma.category.delete({ where: { id: categoryId } });

  await logAdminAction(admin.id, `Deleted category: ${category.name}`);
  revalidateAdmin();
  revalidateCatalogue();
}

export async function createProduct(formData: FormData) {
  const admin = await requirePermission("PRODUCTS", "CREATE");
  const name = requiredString(formData, "name");
  const imageFile = formData.get("image");
  const uploadedImage =
    imageFile instanceof File && imageFile.size > 0
      ? await uploadMediaFile({
          file: imageFile,
          bucket: MEDIA_BUCKETS.productImages,
          folder: productFolderFromForm(formData),
        })
      : null;
  const imageUrl = uploadedImage?.url ?? optionalString(formData, "imageUrl");
  const uploadedGalleryMedia = await uploadImagesFromForm(formData, "galleryImages");
  const galleryUrls = [
    ...(optionalString(formData, "galleryImageUrls") ?? "")
      .split(/\r?\n/)
      .map((url) => url.trim())
      .filter(Boolean),
  ];

  const product = await prisma.product.create({
    data: {
      name,
      slug: await uniqueSlug("product", optionalString(formData, "slug") ?? name),
      description: requiredString(formData, "description"),
      brand: optionalString(formData, "brand") ?? "",
      price: requiredString(formData, "price"),
      discountPrice: optionalString(formData, "discountPrice"),
      stock: requiredNumber(formData, "stock"),
      lowStockThreshold: requiredNumber(formData, "lowStockThreshold"),
      status: assertProductStatus(requiredString(formData, "status")),
      badges: badgesFromForm(formData),
      imageUrl,
      specifications: parseSpecifications(optionalString(formData, "specifications")),
      categoryId: requiredString(formData, "categoryId"),
      media: {
        create: [
          ...(!uploadedImage && imageUrl ? [externalMediaData(imageUrl)] : []),
          ...galleryUrls.map((url) => externalMediaData(url)),
        ],
      },
    },
  });

  await prisma.media.updateMany({
    where: {
      id: {
        in: [uploadedImage?.id, ...uploadedGalleryMedia.map((item) => item.id)].filter(Boolean) as string[],
      },
    },
    data: { productId: product.id },
  });

  await logAdminAction(admin.id, `Created product: ${product.name}`);
  revalidateAdmin();
  revalidateCatalogue(product.slug);
}

export async function updateProduct(formData: FormData) {
  const admin = await requirePermission("PRODUCTS", "EDIT");
  const productId = requiredString(formData, "productId");
  const name = requiredString(formData, "name");
  const imageFile = formData.get("image");
  const previousProduct = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true, imageUrl: true, price: true, stock: true, status: true, categoryId: true },
  });
  const uploadedImage =
    imageFile instanceof File && imageFile.size > 0
      ? await uploadMediaFile({
          file: imageFile,
          bucket: MEDIA_BUCKETS.productImages,
          folder: productFolderFromForm(formData),
          productId,
        })
      : null;
  const imageUrl = uploadedImage?.url ?? optionalString(formData, "imageUrl");
  await uploadImagesFromForm(formData, "galleryImages", productId);
  const galleryUrls = [
    ...(optionalString(formData, "galleryImageUrls") ?? "")
      .split(/\r?\n/)
      .map((url) => url.trim())
      .filter(Boolean),
  ];

  const newManualMainImage =
    !uploadedImage && imageUrl && imageUrl !== previousProduct?.imageUrl ? imageUrl : null;
  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      name,
      slug: await uniqueSlug("product", optionalString(formData, "slug") ?? name, productId),
      description: requiredString(formData, "description"),
      brand: optionalString(formData, "brand") ?? "",
      price: requiredString(formData, "price"),
      discountPrice: optionalString(formData, "discountPrice"),
      stock: requiredNumber(formData, "stock"),
      lowStockThreshold: requiredNumber(formData, "lowStockThreshold"),
      status: assertProductStatus(requiredString(formData, "status")),
      badges: badgesFromForm(formData),
      imageUrl,
      specifications: parseSpecifications(optionalString(formData, "specifications")),
      categoryId: requiredString(formData, "categoryId"),
      ...(newManualMainImage || galleryUrls.length > 0
        ? {
            media: {
              create: [
                ...(newManualMainImage ? [externalMediaData(newManualMainImage, productId)] : []),
                ...galleryUrls.map((url) => externalMediaData(url, productId)),
              ],
            },
          }
        : {}),
    },
  });

  await logAdminAction(admin.id, `Updated product: ${product.name}`);
  await logAudit({
    actorId: admin.id,
    actorName: admin.name,
    action: `Updated product ${product.name}`,
    module: "products",
    entityType: "Product",
    entityId: product.id,
    previousValue: previousProduct
      ? {
          price: previousProduct.price.toString(),
          stock: previousProduct.stock,
          status: previousProduct.status,
          categoryId: previousProduct.categoryId,
        }
      : undefined,
    newValue: {
      price: product.price.toString(),
      stock: product.stock,
      status: product.status,
      categoryId: product.categoryId,
    },
  });
  revalidateAdmin();
  revalidateCatalogue(product.slug);

  if (previousProduct?.slug && previousProduct.slug !== product.slug) {
    revalidatePath(`/products/${previousProduct.slug}`);
  }
}

export async function uploadMedia(formData: FormData) {
  const admin = await requirePermission("MEDIA", "MANAGE");
  const bucket = bucketFromForm(formData);
  const folder = folderFromForm(formData, bucket);
  const productId = optionalString(formData, "productId");
  const files = formData.getAll("files");
  const created = [];

  for (const file of files) {
    if (file instanceof File && file.size > 0) {
      const media = await uploadMediaFile({ file, bucket, folder, productId });

      if (media) {
        created.push(media);
      }
    }
  }

  if (created.length === 0) {
    throw new Error("Choose at least one file to upload.");
  }

  await logAdminAction(admin.id, `Uploaded ${created.length} media file${created.length === 1 ? "" : "s"}`);
  revalidateAdmin();
  revalidateCatalogue();
}

export async function deleteMedia(formData: FormData) {
  const admin = await requirePermission("MEDIA", "MANAGE");
  const mediaId = requiredString(formData, "mediaId");
  const media = await deleteMediaObject(mediaId);

  await logAdminAction(admin.id, `Deleted media: ${media.fileName || media.url}`);
  revalidateAdmin();
  revalidateCatalogue();
}

export async function assignMediaToProduct(formData: FormData) {
  const admin = await requirePermission("MEDIA", "MANAGE");
  const mediaId = requiredString(formData, "mediaId");
  const productId = optionalString(formData, "productId");
  const media = await prisma.media.update({
    where: { id: mediaId },
    data: { productId },
    include: { product: true },
  });

  await logAdminAction(
    admin.id,
    productId
      ? `Assigned media ${media.fileName || media.url} to ${media.product?.name ?? "product"}`
      : `Unassigned media ${media.fileName || media.url}`,
  );
  revalidateAdmin();
  revalidateCatalogue(media.product?.slug);
}

export async function updateProductManagement(formData: FormData) {
  return updateProduct(formData);
}

export async function deleteProduct(formData: FormData) {
  const admin = await requirePermission("PRODUCTS", "DELETE");
  const productId = requiredString(formData, "productId");
  const product = await prisma.product.delete({ where: { id: productId } });

  await logAdminAction(admin.id, `Deleted product: ${product.name}`);
  revalidateAdmin();
  revalidateCatalogue(product.slug);
}

export async function updateOrderStatus(formData: FormData) {
  const admin = await requirePermission("ORDERS", "UPDATE_STATUS");
  const orderId = requiredString(formData, "orderId");
  const status = assertOrderStatus(requiredString(formData, "status"));
  const note = optionalString(formData, "note");
  const previousOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { orderStatus: true, orderNumber: true },
  });

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      orderStatus: status,
      statusHistory: {
        create: {
          previousStatus: previousOrder?.orderStatus,
          newStatus: status,
          note,
          changedBy: admin.id,
        },
      },
    },
  });

  await logAdminAction(
    admin.id,
    `Updated order ${order.orderNumber} status to ${order.orderStatus}`,
  );
  await logAudit({
    actorId: admin.id,
    actorName: admin.name,
    action: `Updated order ${order.orderNumber} status`,
    module: "orders",
    entityType: "Order",
    entityId: order.id,
    field: "orderStatus",
    previousValue: previousOrder ? previousOrder.orderStatus : undefined,
    newValue: order.orderStatus,
  });
  revalidateAdmin();
  revalidatePath("/orders");
}

export async function updateUserRole(formData: FormData) {
  const admin = await requirePermission("USERS", "EDIT");
  const userId = requiredString(formData, "userId");
  const roleId = requiredString(formData, "roleId");

  const role = await prisma.userRole.findUnique({ where: { id: roleId } });

  if (!role) {
    throw new Error("Role not found.");
  }

  await prisma.userRoleAssignment.upsert({
    where: { userId_roleId: { userId, roleId } },
    update: { assignedBy: admin.id },
    create: { userId, roleId, assignedBy: admin.id },
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await logAdminAction(admin.id, `Assigned ${role.name} to ${user.email}`);
  revalidateAdmin();
}

export async function createMarketingCampaign(formData: FormData) {
  const admin = await requirePermission("MARKETING", "MANAGE");
  const productIds = formData
    .getAll("productIds")
    .filter((value): value is string => typeof value === "string" && value.trim() !== "");

  const campaign = await prisma.marketingCampaign.create({
    data: {
      name: requiredString(formData, "name"),
      discountPercentage: Math.min(100, requiredNumber(formData, "discountPercentage")),
      status: assertCampaignStatus(requiredString(formData, "status")),
      startsAt: requiredDate(formData, "startsAt"),
      endsAt: requiredDate(formData, "endsAt"),
      products: {
        create: productIds.map((productId) => ({ productId })),
      },
    },
  });

  await logAdminAction(admin.id, `Created marketing campaign: ${campaign.name}`);
  revalidateAdmin();
  revalidateCatalogue();
}

export async function createCoupon(formData: FormData) {
  const admin = await requirePermission("MARKETING", "MANAGE");
  const code = requiredString(formData, "code").toUpperCase().replace(/[^A-Z0-9_-]/g, "");

  if (!code) {
    throw new Error("Coupon code is required.");
  }

  const coupon = await prisma.coupon.create({
    data: {
      code,
      discountPercentage: Math.min(100, requiredNumber(formData, "discountPercentage")),
      minimumOrderAmount: requiredNumber(formData, "minimumOrderAmount").toFixed(2),
      expiresAt: requiredDate(formData, "expiresAt"),
      usageLimit: optionalString(formData, "usageLimit")
        ? Number(optionalString(formData, "usageLimit"))
        : null,
      isActive: formData.get("isActive") === "on",
    },
  });

  await logAdminAction(admin.id, `Created coupon: ${coupon.code}`);
  revalidateAdmin();
}

export async function createHomepageBanner(formData: FormData) {
  const admin = await requirePermission("MARKETING", "MANAGE");
  const uploadedImage = await uploadWebsiteImageFromForm(formData, "image", "banners");
  const title = requiredString(formData, "title");

  const banner = await prisma.homepageBanner.create({
    data: {
      title,
      subtitle: requiredString(formData, "subtitle"),
      imageUrl: uploadedImage?.url ?? optionalString(formData, "imageUrl"),
      primaryLabel: optionalString(formData, "primaryLabel") ?? "Shop Products",
      primaryLink: optionalString(formData, "primaryLink") ?? "/products",
      secondaryLabel: optionalString(formData, "secondaryLabel") ?? "Request a Quote",
      secondaryLink: optionalString(formData, "secondaryLink") ?? "#request-quote",
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(optionalString(formData, "sortOrder") ?? 0),
    },
  });

  await logAdminAction(admin.id, `Created homepage banner: ${banner.title}`);
  revalidateHomepage();
}

export async function updateHomepageBanner(formData: FormData) {
  const admin = await requirePermission("MARKETING", "MANAGE");
  const bannerId = requiredString(formData, "bannerId");
  const uploadedImage = await uploadWebsiteImageFromForm(formData, "image", "banners");
  const imageUrl = uploadedImage?.url ?? optionalString(formData, "imageUrl");

  const banner = await prisma.homepageBanner.update({
    where: { id: bannerId },
    data: {
      title: requiredString(formData, "title"),
      subtitle: requiredString(formData, "subtitle"),
      imageUrl,
      primaryLabel: optionalString(formData, "primaryLabel") ?? "Shop Products",
      primaryLink: optionalString(formData, "primaryLink") ?? "/products",
      secondaryLabel: optionalString(formData, "secondaryLabel") ?? "Request a Quote",
      secondaryLink: optionalString(formData, "secondaryLink") ?? "#request-quote",
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(optionalString(formData, "sortOrder") ?? 0),
    },
  });

  await logAdminAction(admin.id, `Updated homepage banner: ${banner.title}`);
  revalidateHomepage();
}

export async function createPromotion(formData: FormData) {
  const admin = await requirePermission("MARKETING", "MANAGE");
  const uploadedImage = await uploadWebsiteImageFromForm(formData, "image", "promotions");
  const promotion = await prisma.promotion.create({
    data: {
      title: requiredString(formData, "title"),
      description: optionalString(formData, "description"),
      imageUrl: uploadedImage?.url ?? optionalString(formData, "imageUrl"),
      ctaLabel: optionalString(formData, "ctaLabel") ?? "View offer",
      ctaLink: optionalString(formData, "ctaLink") ?? "/products",
      startsAt: optionalDate(formData, "startsAt"),
      endsAt: optionalDate(formData, "endsAt"),
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(optionalString(formData, "sortOrder") ?? 0),
    },
  });

  await logAdminAction(admin.id, `Created homepage promotion: ${promotion.title}`);
  revalidateHomepage();
}

export async function updatePromotion(formData: FormData) {
  const admin = await requirePermission("MARKETING", "MANAGE");
  const promotionId = requiredString(formData, "promotionId");
  const uploadedImage = await uploadWebsiteImageFromForm(formData, "image", "promotions");
  const imageUrl = uploadedImage?.url ?? optionalString(formData, "imageUrl");
  const promotion = await prisma.promotion.update({
    where: { id: promotionId },
    data: {
      title: requiredString(formData, "title"),
      description: optionalString(formData, "description"),
      imageUrl,
      ctaLabel: optionalString(formData, "ctaLabel") ?? "View offer",
      ctaLink: optionalString(formData, "ctaLink") ?? "/products",
      startsAt: optionalDate(formData, "startsAt"),
      endsAt: optionalDate(formData, "endsAt"),
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(optionalString(formData, "sortOrder") ?? 0),
    },
  });

  await logAdminAction(admin.id, `Updated homepage promotion: ${promotion.title}`);
  revalidateHomepage();
}

export async function createBrand(formData: FormData) {
  const admin = await requirePermission("MARKETING", "MANAGE");
  const uploadedImage = await uploadWebsiteImageFromForm(formData, "logo", "brands");
  const brand = await prisma.brand.create({
    data: {
      name: requiredString(formData, "name"),
      logoUrl: uploadedImage?.url ?? optionalString(formData, "logoUrl"),
      website: optionalString(formData, "website"),
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(optionalString(formData, "sortOrder") ?? 0),
    },
  });

  await logAdminAction(admin.id, `Created homepage brand: ${brand.name}`);
  revalidateHomepage();
}

export async function updateBrand(formData: FormData) {
  const admin = await requirePermission("MARKETING", "MANAGE");
  const brandId = requiredString(formData, "brandId");
  const uploadedImage = await uploadWebsiteImageFromForm(formData, "logo", "brands");
  const logoUrl = uploadedImage?.url ?? optionalString(formData, "logoUrl");
  const brand = await prisma.brand.update({
    where: { id: brandId },
    data: {
      name: requiredString(formData, "name"),
      logoUrl,
      website: optionalString(formData, "website"),
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(optionalString(formData, "sortOrder") ?? 0),
    },
  });

  await logAdminAction(admin.id, `Updated homepage brand: ${brand.name}`);
  revalidateHomepage();
}

export async function createIndustrySolution(formData: FormData) {
  const admin = await requirePermission("MARKETING", "MANAGE");
  const uploadedImage = await uploadWebsiteImageFromForm(formData, "image", "banners");
  const solution = await prisma.industrySolution.create({
    data: {
      title: requiredString(formData, "title"),
      description: requiredString(formData, "description"),
      imageUrl: uploadedImage?.url ?? optionalString(formData, "imageUrl"),
      ctaLabel: optionalString(formData, "ctaLabel") ?? "Explore Solutions",
      ctaLink: optionalString(formData, "ctaLink") ?? "/services",
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(optionalString(formData, "sortOrder") ?? 0),
    },
  });

  await logAdminAction(admin.id, `Created industry solution: ${solution.title}`);
  revalidateHomepage();
}

export async function updateIndustrySolution(formData: FormData) {
  const admin = await requirePermission("MARKETING", "MANAGE");
  const solutionId = requiredString(formData, "solutionId");
  const uploadedImage = await uploadWebsiteImageFromForm(formData, "image", "banners");
  const imageUrl = uploadedImage?.url ?? optionalString(formData, "imageUrl");
  const solution = await prisma.industrySolution.update({
    where: { id: solutionId },
    data: {
      title: requiredString(formData, "title"),
      description: requiredString(formData, "description"),
      imageUrl,
      ctaLabel: optionalString(formData, "ctaLabel") ?? "Explore Solutions",
      ctaLink: optionalString(formData, "ctaLink") ?? "/services",
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(optionalString(formData, "sortOrder") ?? 0),
    },
  });

  await logAdminAction(admin.id, `Updated industry solution: ${solution.title}`);
  revalidateHomepage();
}

export async function createService(formData: FormData) {
  const admin = await requirePermission("MARKETING", "MANAGE");
  const service = await prisma.service.create({
    data: {
      title: requiredString(formData, "title"),
      description: requiredString(formData, "description"),
      icon: optionalString(formData, "icon"),
      ctaLink: optionalString(formData, "ctaLink") ?? "/services",
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(optionalString(formData, "sortOrder") ?? 0),
    },
  });

  await logAdminAction(admin.id, `Created homepage service: ${service.title}`);
  revalidateHomepage();
}

export async function updateService(formData: FormData) {
  const admin = await requirePermission("MARKETING", "MANAGE");
  const serviceId = requiredString(formData, "serviceId");
  const service = await prisma.service.update({
    where: { id: serviceId },
    data: {
      title: requiredString(formData, "title"),
      description: requiredString(formData, "description"),
      icon: optionalString(formData, "icon"),
      ctaLink: optionalString(formData, "ctaLink") ?? "/services",
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(optionalString(formData, "sortOrder") ?? 0),
    },
  });

  await logAdminAction(admin.id, `Updated homepage service: ${service.title}`);
  revalidateHomepage();
}

export async function createTestimonial(formData: FormData) {
  const admin = await requirePermission("MARKETING", "MANAGE");
  const testimonial = await prisma.testimonial.create({
    data: {
      customer: requiredString(formData, "customer"),
      company: optionalString(formData, "company"),
      review: requiredString(formData, "review"),
      rating: Math.min(5, Math.max(1, requiredNumber(formData, "rating"))),
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(optionalString(formData, "sortOrder") ?? 0),
    },
  });

  await logAdminAction(admin.id, `Created testimonial: ${testimonial.customer}`);
  revalidateHomepage();
}

export async function updateTestimonial(formData: FormData) {
  const admin = await requirePermission("MARKETING", "MANAGE");
  const testimonialId = requiredString(formData, "testimonialId");
  const testimonial = await prisma.testimonial.update({
    where: { id: testimonialId },
    data: {
      customer: requiredString(formData, "customer"),
      company: optionalString(formData, "company"),
      review: requiredString(formData, "review"),
      rating: Math.min(5, Math.max(1, requiredNumber(formData, "rating"))),
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(optionalString(formData, "sortOrder") ?? 0),
    },
  });

  await logAdminAction(admin.id, `Updated testimonial: ${testimonial.customer}`);
  revalidateHomepage();
}

export async function updateQuoteRequestStatus(formData: FormData) {
  const admin = await requirePermission("MARKETING", "MANAGE");
  const quoteRequest = await prisma.quoteRequest.update({
    where: { id: requiredString(formData, "quoteRequestId") },
    data: {
      status: assertQuoteStatus(requiredString(formData, "status")),
    },
  });

  await logAdminAction(admin.id, `Updated quote request from: ${quoteRequest.name}`);
  revalidateHomepage();
}

export async function updateLowStockThreshold(formData: FormData) {
  const admin = await requirePermission("PRODUCTS", "EDIT");
  const productId = requiredString(formData, "productId");
  const threshold = requiredNumber(formData, "lowStockThreshold");
  const product = await prisma.product.update({
    where: { id: productId },
    data: { lowStockThreshold: threshold },
  });

  await logAdminAction(admin.id, `Updated low stock threshold for ${product.name}`);
  revalidateAdmin();
  revalidateCatalogue(product.slug);
}

export async function bulkUpdateProducts(formData: FormData) {
  const admin = await requirePermission("PRODUCTS", "BULK");
  const productIds = formData
    .getAll("productIds")
    .filter((value): value is string => typeof value === "string" && value.trim() !== "");
  const operation = requiredString(formData, "operation");

  if (productIds.length === 0) {
    throw new Error("Select at least one product.");
  }

  const previousProducts: BulkProductSnapshot[] = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, price: true, stock: true, status: true },
  });

  if (operation === "delete") {
    await requirePermission("PRODUCTS", "DELETE");
    await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  } else if (operation === "price") {
    await requirePermission("PRODUCTS", "EDIT");
    await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { price: requiredString(formData, "price") },
    });
  } else if (operation === "stock") {
    await requirePermission("PRODUCTS", "EDIT");
    await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { stock: requiredNumber(formData, "stock") },
    });
  } else if (operation === "status") {
    await requirePermission("PRODUCTS", "EDIT");
    await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { status: assertProductStatus(requiredString(formData, "status")) },
    });
  } else {
    throw new Error("Invalid bulk operation.");
  }

  await logAudit({
    actorId: admin.id,
    actorName: admin.name,
    action: `Bulk product ${operation}`,
    module: "products",
    entityType: "Product",
    previousValue: previousProducts.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price.toString(),
      stock: product.stock,
      status: product.status,
    })),
    newValue: {
      operation,
      productIds,
      price: optionalString(formData, "price"),
      stock: optionalString(formData, "stock"),
      status: optionalString(formData, "status"),
    },
  });
  await logAdminAction(admin.id, `Bulk ${operation} on ${productIds.length} products`);
  revalidateAdmin();
  revalidateCatalogue();
}

export async function updateOrderDetails(formData: FormData) {
  const admin = await requirePermission("ORDERS", "EDIT");
  const orderId = requiredString(formData, "orderId");
  const previousOrder = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    select: {
      orderNumber: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      deliveryAddress: true,
      city: true,
      country: true,
      deliveryStatus: true,
      deliveryProvider: true,
      internalNotes: true,
    },
  });

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      customerName: requiredString(formData, "customerName"),
      customerEmail: requiredString(formData, "customerEmail"),
      customerPhone: requiredString(formData, "customerPhone"),
      deliveryAddress: requiredString(formData, "deliveryAddress"),
      city: requiredString(formData, "city"),
      country: requiredString(formData, "country"),
      deliveryStatus: assertDeliveryStatus(requiredString(formData, "deliveryStatus")),
      deliveryProvider: optionalString(formData, "deliveryProvider"),
      internalNotes: optionalString(formData, "internalNotes"),
    },
  });

  await logAudit({
    actorId: admin.id,
    actorName: admin.name,
    action: `Updated order ${order.orderNumber} details`,
    module: "orders",
    entityType: "Order",
    entityId: order.id,
    previousValue: previousOrder,
    newValue: {
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
      city: order.city,
      country: order.country,
      deliveryStatus: order.deliveryStatus,
      deliveryProvider: order.deliveryProvider,
      internalNotes: order.internalNotes,
    },
  });
  await logAdminAction(admin.id, `Updated order details: ${order.orderNumber}`);
  revalidateAdmin();
  revalidatePath("/orders");
}

export async function addOrderIssue(formData: FormData) {
  const admin = await requirePermission("ORDERS", "EDIT");
  const orderId = requiredString(formData, "orderId");
  const issue = await prisma.orderIssue.create({
    data: {
      orderId,
      title: requiredString(formData, "title"),
      status: optionalString(formData, "status") ?? "OPEN",
      note: requiredString(formData, "note"),
      createdBy: admin.id,
    },
    include: { order: true },
  });

  await logAdminAction(admin.id, `Added issue to order ${issue.order.orderNumber}: ${issue.title}`);
  revalidateAdmin();
}

export async function createUserRecord(formData: FormData) {
  const admin = await requirePermission("USERS", "CREATE");
  const email = requiredString(formData, "email").toLowerCase();
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: requiredString(formData, "name") },
    create: {
      email,
      name: requiredString(formData, "name"),
      role: "CUSTOMER",
    },
  });

  const roleId = optionalString(formData, "roleId");
  if (roleId) {
    await prisma.userRoleAssignment.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      update: { assignedBy: admin.id },
      create: { userId: user.id, roleId, assignedBy: admin.id },
    });
  }

  await logAdminAction(admin.id, `Created or updated user: ${user.email}`);
  revalidateAdmin();
}

export async function removeUserRole(formData: FormData) {
  const admin = await requirePermission("USERS", "EDIT");
  const assignmentId = requiredString(formData, "assignmentId");
  const assignment = await prisma.userRoleAssignment.findUniqueOrThrow({
    where: { id: assignmentId },
    include: { user: true, role: true },
  });

  if (assignment.userId === admin.id && assignment.role.slug === "super-admin") {
    throw new Error("You cannot remove your own Super Admin role.");
  }

  await prisma.userRoleAssignment.delete({ where: { id: assignmentId } });
  await logAdminAction(admin.id, `Removed ${assignment.role.name} from ${assignment.user.email}`);
  revalidateAdmin();
}

export async function createAdminRole(formData: FormData) {
  const admin = await requirePermission("ROLES", "CREATE");
  const name = requiredString(formData, "name");
  const role = await prisma.userRole.create({
    data: {
      name,
      slug: await uniqueRoleSlug(name),
      description: optionalString(formData, "description"),
      isSystem: false,
    },
  });

  await logAdminAction(admin.id, `Created role: ${role.name}`);
  revalidateAdmin();
}

async function uniqueRoleSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let index = 2;

  while (await prisma.userRole.findUnique({ where: { slug } })) {
    slug = `${base}-${index}`;
    index += 1;
  }

  return slug;
}

export async function updateRolePermissions(formData: FormData) {
  const admin = await requirePermission("PERMISSIONS", "MANAGE");
  const roleId = requiredString(formData, "roleId");
  const permissionIds = formData
    .getAll("permissionIds")
    .filter((value): value is string => typeof value === "string" && value.trim() !== "");
  const role = await prisma.userRole.findUniqueOrThrow({
    where: { id: roleId },
    include: { permissions: { include: { permission: true } } },
  });

  if (role.slug === "super-admin") {
    throw new Error("Super Admin permissions cannot be reduced.");
  }

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    ...permissionIds.map((permissionId) =>
      prisma.rolePermission.create({
        data: { roleId, permissionId },
      }),
    ),
  ]);

  await logAudit({
    actorId: admin.id,
    actorName: admin.name,
    action: `Updated permissions for ${role.name}`,
    module: "permissions",
    entityType: "UserRole",
    entityId: role.id,
    previousValue: role.permissions.map((item: { permission: { code: string } }) => item.permission.code),
    newValue: permissionIds,
  });
  await logAdminAction(admin.id, `Updated permissions for role: ${role.name}`);
  revalidateAdmin();
}

export async function deleteCustomRole(formData: FormData) {
  const admin = await requirePermission("ROLES", "DELETE");
  const roleId = requiredString(formData, "roleId");
  const role = await prisma.userRole.findUniqueOrThrow({ where: { id: roleId } });

  if (role.isSystem) {
    throw new Error("System roles cannot be deleted.");
  }

  await prisma.userRole.delete({ where: { id: roleId } });
  await logAdminAction(admin.id, `Deleted custom role: ${role.name}`);
  revalidateAdmin();
}
