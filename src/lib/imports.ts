import type { InputJsonValue } from "@prisma/client/runtime/client.js";
import { prisma } from "./prisma.ts";
import {
  normalizeProductImportRow,
  normalizeOptionalImportNumber,
  productImportTemplateHeaders,
  normalizeStrictImportNumber,
  validateProductImportPricing,
  type ProductImportRowInput,
} from "./product-import-normalization.ts";
import { duplicateImportSkuKey, isValidUrl, validateProductReadiness } from "./product-validation.ts";

export type ImportKind = "products" | "categories" | "price-updates" | "stock-updates";

export type ImportIssue = {
  row: number;
  identifier: string;
  errors: string[];
};

export type ProductImportRow = ProductImportRowInput;

export type CategoryImportRow = {
  categoryName: string;
  slug: string;
  parentCategory: string;
  description: string;
};

export type PriceUpdateImportRow = {
  sku: string;
  slug: string;
  productName: string;
  price: string;
  discountPrice: string;
  reason: string;
};

export type StockUpdateImportRow = {
  sku: string;
  slug: string;
  productName: string;
  stockQuantity: string;
  lowStockThreshold: string;
  reason: string;
};

export type ImportPreview =
  | {
      kind: "products";
      fileName: string;
      totalRows: number;
      validRows: number;
      errorRows: number;
      duplicateRecords: number;
      rows: ProductImportRow[];
      errors: ImportIssue[];
    }
  | {
      kind: "categories";
      fileName: string;
      totalRows: number;
      validRows: number;
      errorRows: number;
      duplicateRecords: number;
      rows: CategoryImportRow[];
      errors: ImportIssue[];
    }
  | {
      kind: "price-updates";
      fileName: string;
      totalRows: number;
      validRows: number;
      errorRows: number;
      duplicateRecords: number;
      rows: PriceUpdateImportRow[];
      errors: ImportIssue[];
    }
  | {
      kind: "stock-updates";
      fileName: string;
      totalRows: number;
      validRows: number;
      errorRows: number;
      duplicateRecords: number;
      rows: StockUpdateImportRow[];
      errors: ImportIssue[];
    };

export type ImportResult = {
  imported: number;
  failed: number;
  totalRows: number;
  errors: ImportIssue[];
  historyId: string;
};

export const productTemplateHeaders = [
  ...productImportTemplateHeaders,
];

export const categoryTemplateHeaders = [
  "Category Name",
  "Slug",
  "Parent Category",
  "Description",
];

export const priceUpdateTemplateHeaders = [
  "SKU",
  "Slug",
  "Product Name",
  "Price",
  "Discount Price",
  "Reason",
];

export const stockUpdateTemplateHeaders = [
  "SKU",
  "Slug",
  "Product Name",
  "Stock Quantity",
  "Low Stock Threshold",
  "Reason",
];

function cell(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (value !== undefined && value !== null) {
      return String(value).trim();
    }
  }

  return "";
}

export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || crypto.randomUUID()
  );
}

async function uniqueSlug(model: "category" | "product", value: string) {
  const base = slugify(value);
  let slug = base;
  let index = 2;

  while (true) {
    const match =
      model === "category"
        ? await prisma.category.findUnique({ where: { slug } })
        : await prisma.product.findUnique({ where: { slug } });

    if (!match) {
      return slug;
    }

    slug = `${base}-${index}`;
    index += 1;
  }
}

function numberValue(value: unknown) {
  const parsed = normalizeOptionalImportNumber(value);
  return parsed.ok ? parsed.value : null;
}

function integerValue(value: string) {
  const parsed = numberValue(value);
  return parsed !== null && Number.isInteger(parsed) ? parsed : null;
}

function parseSpecifications(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const pairs = value
    .split(/[;\r\n]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [key, ...rest] = line.split(":");
      return [key.trim(), rest.join(":").trim()];
    })
    .filter(([key, item]) => key && item);

  return pairs.length > 0 ? Object.fromEntries(pairs) : undefined;
}

function importMediaData(url: string, isPrimary: boolean) {
  return {
    url,
    fileName: url.split("/").pop()?.split("?")[0] || "product-image",
    fileType: url.match(/\.(mp4|mov|webm)(\?|$)/i) ? "video/external" : "image/external",
    fileSize: 0,
    storagePath: url,
    type: "IMAGE" as const,
    source: "IMPORT",
    isPrimary,
    metadata: { importedUrl: url },
  };
}

function productRow(raw: Record<string, unknown>): ProductImportRow {
  return normalizeProductImportRow(raw);
}

function categoryRow(raw: Record<string, unknown>): CategoryImportRow {
  return {
    categoryName: cell(raw, "Category Name", "Name"),
    slug: cell(raw, "Slug"),
    parentCategory: cell(raw, "Parent Category", "Parent"),
    description: cell(raw, "Description"),
  };
}

function priceUpdateRow(raw: Record<string, unknown>): PriceUpdateImportRow {
  return {
    sku: cell(raw, "SKU", "Sku"),
    slug: cell(raw, "Slug"),
    productName: cell(raw, "Product Name", "Name"),
    price: cell(raw, "Price", "New Price"),
    discountPrice: cell(raw, "Discount Price"),
    reason: cell(raw, "Reason"),
  };
}

function stockUpdateRow(raw: Record<string, unknown>): StockUpdateImportRow {
  return {
    sku: cell(raw, "SKU", "Sku"),
    slug: cell(raw, "Slug"),
    productName: cell(raw, "Product Name", "Name"),
    stockQuantity: cell(raw, "Stock Quantity", "Stock"),
    lowStockThreshold: cell(raw, "Low Stock Threshold"),
    reason: cell(raw, "Reason"),
  };
}

export function normalizeImportRows(kind: ImportKind, rawRows: Record<string, unknown>[]) {
  return rawRows
    .map((row) => {
      if (kind === "products") return productRow(row);
      if (kind === "categories") return categoryRow(row);
      if (kind === "price-updates") return priceUpdateRow(row);
      return stockUpdateRow(row);
    })
    .filter((row) => Object.values(row).some((value) => value.trim() !== ""));
}

async function previewUpdateImport(
  kind: "price-updates" | "stock-updates",
  fileName: string,
  rows: Array<PriceUpdateImportRow | StockUpdateImportRow>,
): Promise<ImportPreview> {
  const products = await prisma.product.findMany({ select: { id: true, name: true, slug: true, sku: true } });
  const productKeys = new Set(products.flatMap((product) => [product.name.toLowerCase(), product.slug.toLowerCase(), product.sku?.toLowerCase()].filter(Boolean) as string[]));
  const seen = new Set<string>();
  let duplicateRecords = 0;
  const errors: ImportIssue[] = [];

  rows.forEach((row, index) => {
    const rowErrors: string[] = [];
    const identifier = row.sku || row.slug || row.productName || `Row ${index + 2}`;
    const lookup = [row.sku, row.slug, row.productName].find(Boolean)?.toLowerCase() ?? "";
    if (!lookup) rowErrors.push("SKU, Slug, or Product Name is required.");
    if (lookup && !productKeys.has(lookup)) rowErrors.push(`Product "${identifier}" does not exist.`);
    if (seen.has(lookup)) {
      duplicateRecords += 1;
      rowErrors.push("Duplicate update row.");
    }
    seen.add(lookup);

    if (kind === "price-updates") {
      const pricing = validateProductImportPricing(row as PriceUpdateImportRow);
      rowErrors.push(...pricing.errors);
    } else {
      const stock = integerValue((row as StockUpdateImportRow).stockQuantity);
      const threshold = integerValue((row as StockUpdateImportRow).lowStockThreshold || "5");
      if (stock === null || stock < 0) rowErrors.push("Stock Quantity must be a valid non-negative whole number.");
      if (threshold === null || threshold < 0) rowErrors.push("Low Stock Threshold must be a valid non-negative whole number.");
    }

    if (rowErrors.length > 0) errors.push({ row: index + 2, identifier, errors: rowErrors });
  });

  return {
    kind,
    fileName,
    totalRows: rows.length,
    validRows: rows.length - errors.length,
    errorRows: errors.length,
    duplicateRecords,
    rows: rows as never,
    errors,
  };
}

export function previewPriceUpdateImport(fileName: string, rows: PriceUpdateImportRow[]) {
  return previewUpdateImport("price-updates", fileName, rows);
}

export function previewStockUpdateImport(fileName: string, rows: StockUpdateImportRow[]) {
  return previewUpdateImport("stock-updates", fileName, rows);
}

export function previewProductImportWithCatalogue(
  fileName: string,
  rows: ProductImportRow[],
  categories: Array<{ name: string; slug: string }>,
  products: Array<{ name: string; slug: string; sku?: string | null }>,
): ImportPreview {
  const categoryKeys = new Set(categories.flatMap((category) => [category.name.toLowerCase(), category.slug.toLowerCase()]));
  const existingProductKeys = new Set(products.flatMap((product) => [product.name.toLowerCase(), product.slug.toLowerCase()]));
  const seen = new Set<string>();
  const seenSku = new Set<string>();
  let duplicateRecords = 0;
  const errors: ImportIssue[] = [];

  rows.forEach((row, index) => {
    const rowErrors: string[] = [];
    const identifier = row.productName || row.supplierSku || row.modelNumber || `Row ${index + 2}`;
    const nameKey = row.productName.toLowerCase();
    const slugKey = slugify(row.productName).toLowerCase();
    const pricing = validateProductImportPricing(row);
    const stock = integerValue(row.stock);
    const skuKey = row.supplierSku ? duplicateImportSkuKey(row.supplierSku) : "";

    const readiness = validateProductReadiness({
      name: row.productName,
      brand: row.brand,
      modelNumber: row.modelNumber,
      sku: row.supplierSku,
      categoryName: row.category,
      description: row.description,
      specifications: row.specifications,
      price: pricing.price.ok ? pricing.price.value : row.price,
      stock,
      manufacturer: row.manufacturer,
      imageUrl: row.productImage1Url,
      media: [row.productImage2Url, row.productImage3Url].filter(Boolean).map((url) => ({ url })),
      warranty: row.warranty,
    });
    rowErrors.push(...readiness.issues.map((issue) => issue.message));
    if (row.category && !categoryKeys.has(row.category.toLowerCase())) rowErrors.push(`Category "${row.category}" does not exist.`);
    if (row.productImage3Url && !isValidUrl(row.productImage3Url)) rowErrors.push("Product Image 3 URL must be a valid http or https URL.");

    const duplicateKey = `${nameKey}|${slugKey}`;
    if (existingProductKeys.has(nameKey) || existingProductKeys.has(slugKey) || seen.has(duplicateKey)) {
      duplicateRecords += 1;
      rowErrors.push("Duplicate product name or slug.");
    }
    seen.add(duplicateKey);
    if (skuKey && seenSku.has(skuKey)) {
      duplicateRecords += 1;
      rowErrors.push("Supplier SKU must be unique.");
    }
    if (skuKey) seenSku.add(skuKey);

    if (rowErrors.length > 0) {
      errors.push({ row: index + 2, identifier, errors: rowErrors });
    }
  });

  return {
    kind: "products",
    fileName,
    totalRows: rows.length,
    validRows: rows.length - errors.length,
    errorRows: errors.length,
    duplicateRecords,
    rows,
    errors,
  };
}

export async function previewProductImport(fileName: string, rows: ProductImportRow[]): Promise<ImportPreview> {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.product.findMany({ select: { name: true, slug: true, sku: true } }),
  ]);

  const preview = previewProductImportWithCatalogue(fileName, rows, categories, products);
  const existingSkus = new Set(products.map((product) => product.sku?.trim().toLowerCase()).filter(Boolean) as string[]);
  const rowsAlreadyInvalid = new Set(preview.errors.map((error) => error.row));
  const extraErrors = rows.flatMap((row, index) => {
    const key = row.supplierSku.trim().toLowerCase();
    return key && existingSkus.has(key)
      ? [{ row: index + 2, identifier: row.productName || row.supplierSku || row.modelNumber || `Row ${index + 2}`, errors: ["Supplier SKU must be unique."] }]
      : [];
  });
  if (extraErrors.length === 0) return preview;
  const newlyInvalidRows = extraErrors.filter((error) => !rowsAlreadyInvalid.has(error.row)).length;
  return {
    ...preview,
    validRows: preview.validRows - newlyInvalidRows,
    errorRows: preview.errorRows + newlyInvalidRows,
    duplicateRecords: preview.duplicateRecords + extraErrors.length,
    errors: [...preview.errors, ...extraErrors],
  };
}

export async function previewCategoryImport(fileName: string, rows: CategoryImportRow[]): Promise<ImportPreview> {
  const categories = await prisma.category.findMany({ select: { name: true, slug: true } });
  const existingKeys = new Set(categories.flatMap((category) => [category.name.toLowerCase(), category.slug.toLowerCase()]));
  const importedNames = new Set(rows.map((row) => row.categoryName.toLowerCase()).filter(Boolean));
  const seen = new Set<string>();
  let duplicateRecords = 0;
  const errors: ImportIssue[] = [];

  rows.forEach((row, index) => {
    const rowErrors: string[] = [];
    const identifier = row.slug || row.categoryName || `Row ${index + 2}`;
    const nameKey = row.categoryName.toLowerCase();
    const slugKey = (row.slug || slugify(row.categoryName)).toLowerCase();
    const duplicateKey = `${nameKey}|${slugKey}`;

    if (!row.categoryName) rowErrors.push("Category Name is required.");

    if (existingKeys.has(nameKey) || existingKeys.has(slugKey) || seen.has(duplicateKey)) {
      duplicateRecords += 1;
      rowErrors.push("Duplicate category name or slug.");
    }

    if (
      row.parentCategory &&
      !existingKeys.has(row.parentCategory.toLowerCase()) &&
      !importedNames.has(row.parentCategory.toLowerCase())
    ) {
      rowErrors.push(`Parent Category "${row.parentCategory}" does not exist in the database or import file.`);
    }

    seen.add(duplicateKey);

    if (rowErrors.length > 0) {
      errors.push({ row: index + 2, identifier, errors: rowErrors });
    }
  });

  return {
    kind: "categories",
    fileName,
    totalRows: rows.length,
    validRows: rows.length - errors.length,
    errorRows: errors.length,
    duplicateRecords,
    rows,
    errors,
  };
}

export async function importCategories(adminId: string, fileName: string, rows: CategoryImportRow[]): Promise<ImportResult> {
  const preview = await previewCategoryImport(fileName, rows);
  const invalidRows = new Set(preview.errors.map((error) => error.row));
  const validRows = rows.filter((_, index) => !invalidRows.has(index + 2));
  const created = new Map<string, string>();
  let imported = 0;
  const errors = [...preview.errors];

  const existingCategories = await prisma.category.findMany({ select: { id: true, name: true, slug: true } });
  for (const category of existingCategories) {
    created.set(category.name.toLowerCase(), category.id);
    created.set(category.slug.toLowerCase(), category.id);
  }

  const orderedRows = [...validRows].sort((a, b) => Number(Boolean(a.parentCategory)) - Number(Boolean(b.parentCategory)));

  for (const row of orderedRows) {
    try {
      const parentId = row.parentCategory ? created.get(row.parentCategory.toLowerCase()) : null;

      if (row.parentCategory && !parentId) {
        throw new Error(`Parent Category "${row.parentCategory}" was not imported before this row.`);
      }

      const category = await prisma.category.create({
        data: {
          name: row.categoryName,
          slug: await uniqueSlug("category", row.slug || row.categoryName),
          parentId,
          description: row.description || null,
        },
      });

      created.set(category.name.toLowerCase(), category.id);
      created.set(category.slug.toLowerCase(), category.id);
      imported += 1;
    } catch (error) {
      errors.push({
        row: rows.indexOf(row) + 2,
        identifier: row.slug || row.categoryName,
        errors: [error instanceof Error ? error.message : "Failed to import category."],
      });
    }
  }

  const history = await createImportHistory(adminId, "categories", fileName, rows.length, imported, errors);
  return { imported, failed: rows.length - imported, totalRows: rows.length, errors, historyId: history.id };
}

export async function importProducts(adminId: string, fileName: string, rows: ProductImportRow[]): Promise<ImportResult> {
  const preview = await previewProductImport(fileName, rows);
  const invalidRows = new Set(preview.errors.map((error) => error.row));
  const categories = await prisma.category.findMany({ select: { id: true, name: true, slug: true } });
  const categoryIds = new Map(categories.flatMap((category) => [
    [category.name.toLowerCase(), category.id],
    [category.slug.toLowerCase(), category.id],
  ]));
  let imported = 0;
  const errors = [...preview.errors];

  for (const [index, row] of rows.entries()) {
    if (invalidRows.has(index + 2)) {
      continue;
    }

    try {
      const categoryId = categoryIds.get(row.category.toLowerCase());

      if (!categoryId) {
        throw new Error(`Category "${row.category}" does not exist.`);
      }

      const price = normalizeStrictImportNumber(row.price);

      if (!price.ok) {
        throw new Error("Product price values failed validation before import.");
      }

      const imageUrls = [row.productImage1Url, row.productImage2Url, row.productImage3Url].filter(Boolean);
      const product = await prisma.product.create({
        data: {
          name: row.productName,
          slug: await uniqueSlug("product", row.productName),
          description: row.description || "",
          brand: row.brand,
          sku: row.supplierSku || null,
          modelNumber: row.modelNumber || null,
          manufacturer: row.manufacturer || null,
          manufacturerProductUrl: null,
          datasheetUrl: null,
          warranty: row.warranty || null,
          barcode: null,
          price: price.value,
          discountPrice: null,
          stock: Number(row.stock),
          lowStockThreshold: 5,
          status: "DRAFT",
          badges: [],
          imageUrl: row.productImage1Url || null,
          imageFolder: null,
          specifications: parseSpecifications(row.specifications) as InputJsonValue | undefined,
          categoryId,
          ...(imageUrls.length > 0
            ? {
                media: {
                  create: imageUrls.map((url, imageIndex) => importMediaData(url, imageIndex === 0)),
                },
              }
            : {}),
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: adminId,
          actorName: "Import",
          action: "Imported product as draft",
          module: "products",
          entityType: "Product",
          entityId: product.id,
          metadata: {
            fileName,
            row: index + 2,
            importedStatus: "DRAFT",
            productImage1Url: row.productImage1Url || null,
            productImage2Url: row.productImage2Url || null,
            productImage3Url: row.productImage3Url || null,
          },
        },
      });

      imported += 1;
    } catch (error) {
      errors.push({
        row: index + 2,
        identifier: row.productName || row.supplierSku || row.modelNumber,
        errors: [error instanceof Error ? error.message : "Failed to import product."],
      });
    }
  }

  const history = await createImportHistory(adminId, "products", fileName, rows.length, imported, errors);
  return { imported, failed: rows.length - imported, totalRows: rows.length, errors, historyId: history.id };
}

function productLookupWhere(row: { sku: string; slug: string; productName: string }) {
  return {
    OR: [
      ...(row.sku ? [{ sku: row.sku }] : []),
      ...(row.slug ? [{ slug: row.slug }] : []),
      ...(row.productName ? [{ name: row.productName }] : []),
    ],
  };
}

export async function importPriceUpdates(adminId: string, fileName: string, rows: PriceUpdateImportRow[]): Promise<ImportResult> {
  const preview = await previewPriceUpdateImport(fileName, rows);
  const invalidRows = new Set(preview.errors.map((error) => error.row));
  const errors = [...preview.errors];
  let imported = 0;

  for (const [index, row] of rows.entries()) {
    if (invalidRows.has(index + 2)) continue;
    try {
      const product = await prisma.product.findFirstOrThrow({ where: productLookupWhere(row) });
      const previousPrice = product.price;
      const price = normalizeStrictImportNumber(row.price);
      const discountPrice = normalizeOptionalImportNumber(row.discountPrice);
      if (!price.ok || !discountPrice.ok || (discountPrice.value !== null && discountPrice.value >= price.value)) {
        throw new Error("Product price values failed validation before import.");
      }
      await prisma.product.update({
        where: { id: product.id },
        data: {
          price: price.value,
          discountPrice: discountPrice.value,
        },
      });
      await prisma.priceHistory.create({
        data: {
          productId: product.id,
          source: "bulk-import",
          recommendedPrice: price.value,
          targetMarginPercent: 0,
          reason: row.reason || `Bulk price update from ${previousPrice.toString()} to ${price.value.toFixed(2)}`,
        },
      });
      imported += 1;
    } catch (error) {
      errors.push({ row: index + 2, identifier: row.sku || row.slug || row.productName, errors: [error instanceof Error ? error.message : "Failed to update price."] });
    }
  }

  const history = await createImportHistory(adminId, "price-updates", fileName, rows.length, imported, errors);
  return { imported, failed: rows.length - imported, totalRows: rows.length, errors, historyId: history.id };
}

export async function importStockUpdates(adminId: string, fileName: string, rows: StockUpdateImportRow[]): Promise<ImportResult> {
  const preview = await previewStockUpdateImport(fileName, rows);
  const invalidRows = new Set(preview.errors.map((error) => error.row));
  const errors = [...preview.errors];
  let imported = 0;

  for (const [index, row] of rows.entries()) {
    if (invalidRows.has(index + 2)) continue;
    try {
      const product = await prisma.product.findFirstOrThrow({ where: productLookupWhere(row) });
      const nextStock = Number(row.stockQuantity);
      const change = nextStock - product.stock;
      await prisma.product.update({
        where: { id: product.id },
        data: {
          stock: nextStock,
          lowStockThreshold: row.lowStockThreshold ? Number(row.lowStockThreshold) : product.lowStockThreshold,
        },
      });
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          change,
          reason: row.reason || "Bulk stock update",
        },
      });
      imported += 1;
    } catch (error) {
      errors.push({ row: index + 2, identifier: row.sku || row.slug || row.productName, errors: [error instanceof Error ? error.message : "Failed to update stock."] });
    }
  }

  const history = await createImportHistory(adminId, "stock-updates", fileName, rows.length, imported, errors);
  return { imported, failed: rows.length - imported, totalRows: rows.length, errors, historyId: history.id };
}

async function createImportHistory(
  adminId: string,
  type: ImportKind,
  fileName: string,
  totalRows: number,
  imported: number,
  errors: ImportIssue[],
) {
  return prisma.importHistory.create({
    data: {
      adminId,
      type,
      fileName,
      totalRows,
      importedRecords: imported,
      failedRecords: totalRows - imported,
      errorReport: errors.length > 0 ? errors : undefined,
    },
  });
}
