import type { ConnectionType } from "@prisma/client";
import type { InputJsonObject } from "@prisma/client/runtime/client.js";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/imports";

export type CatalogueSourceKind = "manufacturer_catalogue" | "public_manufacturer_data" | "excel" | "csv" | "json";

export type RawCatalogueRow = Record<string, unknown>;

export type ProductPipelineStage =
  | "raw_product_data"
  | "duplicate_detection"
  | "brand_detection"
  | "category_classification"
  | "specification_extraction"
  | "image_verification"
  | "seo_generation"
  | "database_product_creation";

export type ProductIntelligencePreviewRow = {
  row: number;
  sourceKey: string;
  name: string;
  brand: string;
  modelNumber: string | null;
  sku: string | null;
  categoryName: string | null;
  categoryId: string | null;
  description: string | null;
  imageUrls: string[];
  specificationCount: number;
  seoTitle: string;
  duplicate: boolean;
  duplicateReason: string | null;
  duplicateProductId: string | null;
  missingImages: boolean;
  missingSpecifications: boolean;
  issues: string[];
  readyForProductCreation: boolean;
  workflow: Record<ProductPipelineStage, "complete" | "warning" | "blocked">;
  rawData: RawCatalogueRow;
};

export type ProductIntelligencePreview = {
  fileName: string;
  fileType: ConnectionType;
  sourceKind: CatalogueSourceKind;
  totalRows: number;
  detectedProducts: number;
  duplicates: number;
  missingImages: number;
  missingSpecifications: number;
  readyForCreation: number;
  rows: ProductIntelligencePreviewRow[];
};

export type ProductIntelligenceProcessResult = {
  catalogueImportId: string;
  automationJobId: string;
  productSourcesCreated: number;
  productsCreated: number;
  matchedProducts: number;
  failedRows: number;
};

const stageOrder: ProductPipelineStage[] = [
  "raw_product_data",
  "duplicate_detection",
  "brand_detection",
  "category_classification",
  "specification_extraction",
  "image_verification",
  "seo_generation",
  "database_product_creation",
];

const knownBrandAliases = new Map([
  ["hewlett packard", "HP"],
  ["hp", "HP"],
  ["canon", "Canon"],
  ["epson", "Epson"],
  ["brother", "Brother"],
  ["kyocera", "Kyocera"],
  ["xerox", "Xerox"],
  ["ricoh", "Ricoh"],
  ["zebra", "Zebra"],
  ["dell", "Dell"],
  ["lenovo", "Lenovo"],
  ["asus", "Asus"],
  ["acer", "Acer"],
  ["tp-link", "TP-Link"],
  ["tplink", "TP-Link"],
  ["cisco", "Cisco"],
  ["ubiquiti", "Ubiquiti"],
  ["mikrotik", "Mikrotik"],
  ["d-link", "D-Link"],
  ["kingston", "Kingston"],
  ["samsung", "Samsung"],
  ["seagate", "Seagate"],
  ["western digital", "Western Digital"],
  ["wd", "Western Digital"],
  ["apc", "APC"],
  ["eaton", "Eaton"],
]);

const textKeys = {
  name: ["Product Name", "Name", "Title", "Product", "productName", "name", "title"],
  brand: ["Brand", "Manufacturer", "Make", "brand", "manufacturer", "make"],
  model: ["Model", "Model Number", "Model No", "Part Number", "MPN", "model", "modelNumber", "partNumber", "mpn"],
  sku: ["SKU", "Item Code", "Product Code", "sku", "itemCode", "productCode"],
  barcode: ["Barcode", "UPC", "EAN", "barcode", "upc", "ean"],
  category: ["Category", "Category Name", "Type", "Product Type", "category", "categoryName", "type"],
  description: ["Description", "Short Description", "Long Description", "description", "shortDescription", "longDescription"],
  image: ["Image URL", "Product Image URL", "Image", "Images", "imageUrl", "image", "images"],
  datasheet: ["Datasheet URL", "Datasheet", "datasheetUrl", "datasheet"],
  sourceUrl: ["Source URL", "URL", "Product URL", "sourceUrl", "url", "productUrl"],
  warranty: ["Warranty", "Warranty Info", "warranty", "warrantyInfo"],
  price: ["Price", "RRP", "MSRP", "price", "rrp", "msrp"],
  stock: ["Stock", "Quantity", "stock", "quantity"],
  specifications: ["Specifications", "Technical Specifications", "Specs", "specifications", "technicalSpecifications", "specs"],
};

function valueFrom(row: RawCatalogueRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return "";
}

function normalizeKey(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function splitUrls(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(splitUrls);
  }

  if (!value) {
    return [];
  }

  return String(value)
    .split(/[,\n\r;|]+/)
    .map((url) => url.trim())
    .filter(Boolean);
}

function imageUrlsFrom(row: RawCatalogueRow) {
  const values = textKeys.image.flatMap((key) => splitUrls(row[key]));

  return [...new Set(values)].filter((url) => /^https?:\/\//i.test(url));
}

function datasheetUrlsFrom(row: RawCatalogueRow) {
  const values = textKeys.datasheet.flatMap((key) => splitUrls(row[key]));

  return [...new Set(values)].filter((url) => /^https?:\/\//i.test(url));
}

function parseSpecificationText(value: string) {
  if (!value.trim()) {
    return {};
  }

  return Object.fromEntries(
    value
      .split(/[;\n\r]+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [key, ...rest] = line.split(":");
        return [key.trim(), rest.join(":").trim()];
      })
      .filter(([key, item]) => key && item),
  );
}

function extractSpecifications(row: RawCatalogueRow) {
  const directValue = valueFrom(row, textKeys.specifications);
  const specifications: Record<string, string> = parseSpecificationText(directValue);
  const ignoredKeys = new Set(Object.values(textKeys).flat());

  for (const [key, value] of Object.entries(row)) {
    if (ignoredKeys.has(key) || value === null || value === undefined || String(value).trim() === "") {
      continue;
    }

    if (/spec|speed|capacity|connect|duplex|resolution|memory|processor|paper|yield|interface|weight|dimension/i.test(key)) {
      specifications[key] = String(value).trim();
    }
  }

  return specifications;
}

function detectBrand(row: RawCatalogueRow, name: string, manufacturers: { name: string }[]) {
  const explicitBrand = valueFrom(row, textKeys.brand);

  if (explicitBrand) {
    return knownBrandAliases.get(explicitBrand.toLowerCase()) ?? explicitBrand;
  }

  const haystack = ` ${name.toLowerCase()} `;
  const manufacturer = manufacturers.find((item) => haystack.includes(` ${item.name.toLowerCase()} `));

  if (manufacturer) {
    return manufacturer.name;
  }

  for (const [alias, brand] of knownBrandAliases) {
    if (haystack.includes(` ${alias} `)) {
      return brand;
    }
  }

  return "";
}

function categoryHint(row: RawCatalogueRow, name: string, description: string) {
  const explicitCategory = valueFrom(row, textKeys.category);

  if (explicitCategory) {
    return explicitCategory;
  }

  const text = `${name} ${description}`.toLowerCase();

  if (/printer|laserjet|inkjet|toner|cartridge|scanner|multifunction|mfp/.test(text)) return "Printers";
  if (/laptop|desktop|workstation|monitor|computer|notebook/.test(text)) return "Computers";
  if (/router|switch|access point|network|ethernet|wifi|wi-fi|firewall/.test(text)) return "Networking";
  if (/ssd|hdd|drive|storage|memory|ram|usb/.test(text)) return "Storage";
  if (/ups|battery|power|surge|inverter/.test(text)) return "Power";
  if (/cable|adapter|accessory|stand|tray/.test(text)) return "Accessories";

  return "";
}

function classifyCategory(
  row: RawCatalogueRow,
  name: string,
  description: string,
  categories: { id: string; name: string; slug: string }[],
) {
  const hint = categoryHint(row, name, description);
  const normalizedHint = normalizeKey(hint);
  const directMatch = categories.find(
    (category) => normalizeKey(category.name) === normalizedHint || normalizeKey(category.slug) === normalizedHint,
  );

  if (directMatch) {
    return directMatch;
  }

  return categories.find((category) => normalizedHint && normalizeKey(category.name).includes(normalizedHint)) ?? null;
}

function seoTitle(name: string, brand: string, modelNumber: string | null) {
  const parts = [brand, name, modelNumber].filter(Boolean);
  return [...new Set(parts)].join(" ").slice(0, 70);
}

function seoDescription(name: string, brand: string, categoryName: string | null, description: string | null) {
  const base = description || `Buy ${brand ? `${brand} ` : ""}${name}${categoryName ? ` under ${categoryName}` : ""} from CETER Technology.`;
  return base.replace(/\s+/g, " ").trim().slice(0, 155);
}

function confidenceFromScore(score: number) {
  if (score >= 95) return "EXACT";
  if (score >= 80) return "HIGH";
  if (score >= 55) return "MEDIUM";
  return "LOW";
}

function decimalText(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  const number = Number(normalized);

  return Number.isFinite(number) && number >= 0 ? number.toFixed(2) : "0";
}

function integerValue(value: string) {
  const number = Number(value.replace(/,/g, "").trim());

  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
}

function workflow(row: Omit<ProductIntelligencePreviewRow, "workflow">): Record<ProductPipelineStage, "complete" | "warning" | "blocked"> {
  return Object.fromEntries(
    stageOrder.map((stage) => {
      if (stage === "duplicate_detection") return [stage, row.duplicate ? "blocked" : "complete"];
      if (stage === "brand_detection") return [stage, row.brand ? "complete" : "warning"];
      if (stage === "category_classification") return [stage, row.categoryId ? "complete" : "blocked"];
      if (stage === "specification_extraction") return [stage, row.missingSpecifications ? "warning" : "complete"];
      if (stage === "image_verification") return [stage, row.missingImages ? "warning" : "complete"];
      if (stage === "database_product_creation") return [stage, row.readyForProductCreation ? "complete" : "blocked"];
      return [stage, "complete"];
    }),
  ) as Record<ProductPipelineStage, "complete" | "warning" | "blocked">;
}

function fileTypeFromName(fileName: string): ConnectionType {
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) return "EXCEL";
  if (lowerName.endsWith(".csv")) return "CSV";
  if (lowerName.endsWith(".json")) return "JSON";

  return "WEB_CATALOGUE";
}

export function sourceKindFromFileName(fileName: string, fallback: CatalogueSourceKind): CatalogueSourceKind {
  const fileType = fileTypeFromName(fileName);

  if (fileType === "EXCEL") return "excel";
  if (fileType === "CSV") return "csv";
  if (fileType === "JSON") return "json";

  return fallback;
}

export async function parseCatalogueFile(file: File): Promise<RawCatalogueRow[]> {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".json")) {
    const payload = JSON.parse(await file.text());
    const rows: unknown[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.products)
        ? payload.products
        : Array.isArray(payload.items)
          ? payload.items
          : Array.isArray(payload.data)
            ? payload.data
            : [];

    return rows.filter((row): row is RawCatalogueRow => typeof row === "object" && row !== null);
  }

  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  return XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
  }) as RawCatalogueRow[];
}

export async function parsePublicManufacturerData(url: string): Promise<{ fileName: string; rows: RawCatalogueRow[] }> {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Manufacturer data returned ${response.status}.`);
  }

  const fileName = url.split("/").pop()?.split("?")[0] || "manufacturer-data.json";
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (contentType.includes("json") || fileName.toLowerCase().endsWith(".json")) {
    const payload = JSON.parse(text);
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.products)
        ? payload.products
        : Array.isArray(payload.items)
          ? payload.items
          : Array.isArray(payload.data)
            ? payload.data
            : [];

    return { fileName, rows };
  }

  const XLSX = await import("xlsx");
  const workbook = XLSX.read(text, { type: "string" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  return {
    fileName,
    rows: XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false }) as RawCatalogueRow[],
  };
}

export async function previewProductIntelligenceImport({
  fileName,
  sourceKind,
  rows,
}: {
  fileName: string;
  sourceKind: CatalogueSourceKind;
  rows: RawCatalogueRow[];
}): Promise<ProductIntelligencePreview> {
  const [categories, manufacturers, products, productSources] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.manufacturer.findMany({ select: { id: true, name: true } }),
    prisma.product.findMany({ select: { id: true, name: true, slug: true, brand: true } }),
    prisma.productSource.findMany({ select: { id: true, name: true, brand: true, modelNumber: true, sku: true, productId: true } }),
  ]);
  const productKeys = new Map<string, string>();
  const sourceKeys = new Map<string, string | null>();

  for (const product of products) {
    productKeys.set(normalizeKey(product.slug), product.id);
    productKeys.set(normalizeKey(`${product.brand}-${product.name}`), product.id);
  }

  for (const source of productSources) {
    sourceKeys.set(normalizeKey(`${source.brand}-${source.modelNumber || source.sku || source.name}`), source.productId);
  }

  const seen = new Set<string>();
  const previewRows = rows
    .filter((row) => Object.values(row).some((value) => String(value ?? "").trim() !== ""))
    .map((rawData, index) => {
      const name = valueFrom(rawData, textKeys.name);
      const description = valueFrom(rawData, textKeys.description) || null;
      const modelNumber = valueFrom(rawData, textKeys.model) || null;
      const sku = valueFrom(rawData, textKeys.sku) || null;
      const brand = detectBrand(rawData, name, manufacturers);
      const category = classifyCategory(rawData, name, description ?? "", categories);
      const specifications = extractSpecifications(rawData);
      const imageUrls = imageUrlsFrom(rawData);
      const sourceKey = normalizeKey(`${brand}-${modelNumber || sku || name}`);
      const nameKey = normalizeKey(`${brand}-${name}`);
      const existingSourceMatch = sourceKeys.has(sourceKey);
      const duplicateProductId = productKeys.get(nameKey) ?? productKeys.get(normalizeKey(slugify(name))) ?? sourceKeys.get(sourceKey) ?? null;
      const duplicate = Boolean(duplicateProductId) || existingSourceMatch || seen.has(sourceKey);
      const duplicateReason = duplicate
        ? seen.has(sourceKey)
          ? "Duplicate inside this catalogue."
          : "Matches an existing product or source record."
        : null;
      const missingImages = imageUrls.length === 0;
      const missingSpecifications = Object.keys(specifications).length === 0;
      const issues = [
        !name ? "Product name is required." : null,
        !brand ? "Brand could not be detected." : null,
        !category ? "Category could not be classified." : null,
        missingImages ? "No verified image URL detected." : null,
        missingSpecifications ? "No specifications detected." : null,
        duplicate ? duplicateReason : null,
      ].filter((issue): issue is string => Boolean(issue));
      const readyForProductCreation = Boolean(name && category && !duplicate);
      const rowBase = {
        row: index + 2,
        sourceKey: sourceKey || normalizeKey(name),
        name,
        brand,
        modelNumber,
        sku,
        categoryName: category?.name ?? (valueFrom(rawData, textKeys.category) || null),
        categoryId: category?.id ?? null,
        description,
        imageUrls,
        specificationCount: Object.keys(specifications).length,
        seoTitle: seoTitle(name, brand, modelNumber),
        duplicate,
        duplicateReason,
        duplicateProductId,
        missingImages,
        missingSpecifications,
        issues,
        readyForProductCreation,
        rawData,
      };

      if (sourceKey) {
        seen.add(sourceKey);
      }

      return {
        ...rowBase,
        workflow: workflow(rowBase),
      };
    });

  return {
    fileName,
    fileType: fileTypeFromName(fileName),
    sourceKind,
    totalRows: rows.length,
    detectedProducts: previewRows.length,
    duplicates: previewRows.filter((row) => row.duplicate).length,
    missingImages: previewRows.filter((row) => row.missingImages).length,
    missingSpecifications: previewRows.filter((row) => row.missingSpecifications).length,
    readyForCreation: previewRows.filter((row) => row.readyForProductCreation).length,
    rows: previewRows,
  };
}

async function uniqueProductSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let index = 2;

  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${base}-${index}`;
    index += 1;
  }

  return slug;
}

async function defaultDataSourceId(fileType: ConnectionType) {
  const existing = await prisma.dataSource.findFirst({
    where: { name: "Catalogue automation imports" },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const dataSource = await prisma.dataSource.create({
    data: {
      name: "Catalogue automation imports",
      type: "MANUFACTURER",
      connectionType: fileType,
      updateFrequency: "DAILY",
      status: "ACTIVE",
      notes: "System source for automated catalogue file and manufacturer data ingestion.",
    },
    select: { id: true },
  });

  return dataSource.id;
}

export async function processProductIntelligenceImport({
  adminId,
  dataSourceId,
  preview,
}: {
  adminId: string;
  dataSourceId?: string | null;
  preview: ProductIntelligencePreview;
}): Promise<ProductIntelligenceProcessResult> {
  const startedAt = new Date();
  const sourceId = dataSourceId || (await defaultDataSourceId(preview.fileType));
  const manufacturers = await prisma.manufacturer.findMany({ select: { id: true, name: true } });
  const manufacturerIds = new Map(manufacturers.map((manufacturer) => [manufacturer.name.toLowerCase(), manufacturer.id]));
  let productSourcesCreated = 0;
  let productsCreated = 0;
  let matchedProducts = 0;
  let failedRows = 0;
  const errors: { row: number; identifier: string; errors: string[] }[] = [];

  const catalogueImport = await prisma.catalogueImport.create({
    data: {
      dataSourceId: sourceId,
      fileName: preview.fileName,
      fileType: preview.fileType,
      status: "RUNNING",
      totalRows: preview.totalRows,
      detectedProducts: preview.detectedProducts,
    },
  });

  const job = await prisma.automationJob.create({
    data: {
      name: `product intelligence import - ${preview.fileName}`,
      type: "CATALOGUE_IMPORT",
      status: "RUNNING",
      dataSourceId: sourceId,
      schedule: "On demand",
      recordsRead: preview.detectedProducts,
      missingInfo: {
        duplicates: preview.duplicates,
        missingImages: preview.missingImages,
        missingSpecifications: preview.missingSpecifications,
      },
      startedAt,
    },
  });

  for (const row of preview.rows) {
    try {
      const specifications = extractSpecifications(row.rawData) as InputJsonObject;
      const seoKeywords = [row.brand, row.categoryName, row.modelNumber, row.sku]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.toLowerCase());
      const productSource = await prisma.productSource.create({
        data: {
          dataSourceId: sourceId,
          manufacturerId: row.brand ? manufacturerIds.get(row.brand.toLowerCase()) ?? null : null,
          sourceProductId: valueFrom(row.rawData, textKeys.sku) || valueFrom(row.rawData, textKeys.model) || row.sourceKey,
          sourceUrl: valueFrom(row.rawData, textKeys.sourceUrl) || null,
          name: row.name || `Unnamed product row ${row.row}`,
          modelNumber: row.modelNumber,
          sku: row.sku,
          barcode: valueFrom(row.rawData, textKeys.barcode) || null,
          brand: row.brand || "Unknown",
          categoryName: row.categoryName,
          description: row.description,
          specifications,
          imageUrls: row.imageUrls,
          datasheetUrls: datasheetUrlsFrom(row.rawData),
          warrantyInfo: valueFrom(row.rawData, textKeys.warranty) || null,
          rawData: row.rawData as InputJsonObject,
          seoTitle: row.seoTitle,
          seoDescription: seoDescription(row.name, row.brand, row.categoryName, row.description),
          seoKeywords,
          status: row.duplicate ? "MATCHED" : row.readyForProductCreation ? "PUBLISHED" : "READY_FOR_REVIEW",
          imageVerified: !row.missingImages,
        },
      });
      productSourcesCreated += 1;

      if (row.duplicate && row.duplicateProductId) {
        await prisma.productMatch.create({
          data: {
            productSourceId: productSource.id,
            candidateProductId: row.duplicateProductId,
            confidence: confidenceFromScore(90),
            score: "90",
            matchedOn: [row.modelNumber ? "modelNumber" : "name", row.brand ? "brand" : "source"],
            notes: row.duplicateReason,
          },
        });
        matchedProducts += 1;
      }

      for (const url of row.imageUrls) {
        await prisma.imageSource.create({
          data: {
            productSourceId: productSource.id,
            dataSourceId: sourceId,
            url,
            source: "MANUFACTURER",
            isVerified: true,
          },
        });
      }

      if (row.readyForProductCreation && row.categoryId) {
        const product = await prisma.product.create({
          data: {
            name: row.name,
            slug: await uniqueProductSlug(row.name),
            description: row.description || seoDescription(row.name, row.brand, row.categoryName, null),
            brand: row.brand,
            price: decimalText(valueFrom(row.rawData, textKeys.price)),
            stock: integerValue(valueFrom(row.rawData, textKeys.stock)),
            lowStockThreshold: 5,
            status: "DRAFT",
            imageUrl: row.imageUrls[0] ?? null,
            specifications,
            categoryId: row.categoryId,
            media: {
              create: row.imageUrls.map((url) => ({
                url,
                fileName: url.split("/").pop()?.split("?")[0] || "manufacturer-image",
                fileType: "image/external",
                fileSize: 0,
                storagePath: url,
                type: "IMAGE",
              })),
            },
          },
        });
        await prisma.productSource.update({
          where: { id: productSource.id },
          data: {
            productId: product.id,
            createdProduct: true,
          },
        });
        await prisma.imageSource.updateMany({
          where: { productSourceId: productSource.id },
          data: { productId: product.id },
        });
        productsCreated += 1;
      }
    } catch (error) {
      failedRows += 1;
      errors.push({
        row: row.row,
        identifier: row.name || row.sourceKey,
        errors: [error instanceof Error ? error.message : "Failed to process product row."],
      });
    }
  }

  await prisma.catalogueImport.update({
    where: { id: catalogueImport.id },
    data: {
      status: failedRows > 0 ? "FAILED" : "COMPLETED",
      createdProducts: productsCreated,
      matchedProducts,
      failedRows,
      errorReport: errors.length > 0 ? errors : undefined,
    },
  });

  await prisma.automationJob.update({
    where: { id: job.id },
    data: {
      status: failedRows > 0 ? "FAILED" : "COMPLETED",
      productsCreated,
      imagesCollected: preview.rows.reduce((count, row) => count + row.imageUrls.length, 0),
      failedRecords: failedRows,
      errorMessage: errors.length > 0 ? `${failedRows} rows failed during product intelligence processing.` : null,
      finishedAt: new Date(),
    },
  });

  await prisma.adminLog.create({
    data: {
      adminId,
      action: `Processed ${productSourcesCreated} product source records from ${preview.fileName}`,
    },
  });

  return {
    catalogueImportId: catalogueImport.id,
    automationJobId: job.id,
    productSourcesCreated,
    productsCreated,
    matchedProducts,
    failedRows,
  };
}
