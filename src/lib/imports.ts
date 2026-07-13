import type { InputJsonValue } from "@prisma/client/runtime/client.js";
import { prisma } from "@/lib/prisma";

export type ImportKind = "products" | "categories";

export type ImportIssue = {
  row: number;
  identifier: string;
  errors: string[];
};

export type ProductImportRow = {
  productName: string;
  slug: string;
  description: string;
  category: string;
  brand: string;
  price: string;
  discountPrice: string;
  stockQuantity: string;
  lowStockThreshold: string;
  featured: string;
  newArrival: string;
  bestSeller: string;
  promotion: string;
  status: string;
  productImageUrl: string;
  productImageFolder: string;
  additionalImageUrls: string;
  technicalSpecifications: string;
};

export type CategoryImportRow = {
  categoryName: string;
  slug: string;
  parentCategory: string;
  description: string;
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
    };

export type ImportResult = {
  imported: number;
  failed: number;
  totalRows: number;
  errors: ImportIssue[];
  historyId: string;
};

export const productTemplateHeaders = [
  "Product Name",
  "Slug",
  "Description",
  "Category",
  "Brand",
  "Price",
  "Discount Price",
  "Stock Quantity",
  "Low Stock Threshold",
  "Featured",
  "New Arrival",
  "Best Seller",
  "Promotion",
  "Status",
  "Product Image URL",
  "Product Image Folder",
  "Additional Image URLs",
  "Technical Specifications",
];

export const categoryTemplateHeaders = [
  "Category Name",
  "Slug",
  "Parent Category",
  "Description",
];

const productStatuses = ["ACTIVE", "OUT_OF_STOCK", "DRAFT"] as const;
type ProductBadgeImport = "FEATURED" | "NEW_ARRIVAL" | "BEST_SELLER" | "PROMOTION";

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

function numberValue(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function integerValue(value: string) {
  const parsed = numberValue(value);
  return parsed !== null && Number.isInteger(parsed) ? parsed : null;
}

function booleanValue(value: string) {
  return ["true", "yes", "1", "y"].includes(value.trim().toLowerCase());
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

function additionalUrls(value: string) {
  return value
    .split(/[,\r\n]+/)
    .map((url) => url.trim())
    .filter(Boolean);
}

function productRow(raw: Record<string, unknown>): ProductImportRow {
  return {
    productName: cell(raw, "Product Name", "Name"),
    slug: cell(raw, "Slug"),
    description: cell(raw, "Description"),
    category: cell(raw, "Category", "Category Name"),
    brand: cell(raw, "Brand"),
    price: cell(raw, "Price"),
    discountPrice: cell(raw, "Discount Price"),
    stockQuantity: cell(raw, "Stock Quantity", "Stock"),
    lowStockThreshold: cell(raw, "Low Stock Threshold"),
    featured: cell(raw, "Featured"),
    newArrival: cell(raw, "New Arrival"),
    bestSeller: cell(raw, "Best Seller"),
    promotion: cell(raw, "Promotion"),
    status: cell(raw, "Status"),
    productImageUrl: cell(raw, "Product Image URL", "Image URL"),
    productImageFolder: cell(raw, "Product Image Folder"),
    additionalImageUrls: cell(raw, "Additional Image URLs"),
    technicalSpecifications: cell(raw, "Technical Specifications", "Specifications"),
  };
}

function categoryRow(raw: Record<string, unknown>): CategoryImportRow {
  return {
    categoryName: cell(raw, "Category Name", "Name"),
    slug: cell(raw, "Slug"),
    parentCategory: cell(raw, "Parent Category", "Parent"),
    description: cell(raw, "Description"),
  };
}

export function normalizeImportRows(kind: ImportKind, rawRows: Record<string, unknown>[]) {
  return rawRows
    .map((row) => (kind === "products" ? productRow(row) : categoryRow(row)))
    .filter((row) => Object.values(row).some((value) => value.trim() !== ""));
}

export async function previewProductImport(fileName: string, rows: ProductImportRow[]): Promise<ImportPreview> {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true, slug: true } }),
    prisma.product.findMany({ select: { name: true, slug: true } }),
  ]);
  const categoryKeys = new Set(categories.flatMap((category) => [category.name.toLowerCase(), category.slug.toLowerCase()]));
  const existingProductKeys = new Set(products.flatMap((product) => [product.name.toLowerCase(), product.slug.toLowerCase()]));
  const seen = new Set<string>();
  let duplicateRecords = 0;
  const errors: ImportIssue[] = [];

  rows.forEach((row, index) => {
    const rowErrors: string[] = [];
    const identifier = row.slug || row.productName || `Row ${index + 2}`;
    const nameKey = row.productName.toLowerCase();
    const slugKey = (row.slug || slugify(row.productName)).toLowerCase();
    const price = numberValue(row.price);
    const discountPrice = numberValue(row.discountPrice);
    const stock = integerValue(row.stockQuantity);
    const threshold = integerValue(row.lowStockThreshold || "5");
    const status = (row.status || "DRAFT").toUpperCase();

    if (!row.productName) rowErrors.push("Product Name is required.");
    if (!row.category) rowErrors.push("Category is required.");
    if (!row.brand) rowErrors.push("Brand is required.");
    if (!row.price) rowErrors.push("Price is required.");
    if (!row.stockQuantity) rowErrors.push("Stock Quantity is required.");
    if (price === null || price < 0) rowErrors.push("Price must be a valid non-negative number.");
    if (discountPrice !== null && discountPrice < 0) rowErrors.push("Discount Price must be a valid non-negative number.");
    if (stock === null || stock < 0) rowErrors.push("Stock Quantity must be a valid non-negative whole number.");
    if (threshold === null || threshold < 0) rowErrors.push("Low Stock Threshold must be a valid non-negative whole number.");
    if (row.category && !categoryKeys.has(row.category.toLowerCase())) rowErrors.push(`Category "${row.category}" does not exist.`);
    if (!productStatuses.includes(status as (typeof productStatuses)[number])) rowErrors.push("Status must be ACTIVE, OUT_OF_STOCK, or DRAFT.");

    const duplicateKey = `${nameKey}|${slugKey}`;
    if (existingProductKeys.has(nameKey) || existingProductKeys.has(slugKey) || seen.has(duplicateKey)) {
      duplicateRecords += 1;
      rowErrors.push("Duplicate product name or slug.");
    }
    seen.add(duplicateKey);

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

      const badges = [
        booleanValue(row.featured) ? "FEATURED" : null,
        booleanValue(row.newArrival) ? "NEW_ARRIVAL" : null,
        booleanValue(row.bestSeller) ? "BEST_SELLER" : null,
        booleanValue(row.promotion) ? "PROMOTION" : null,
      ].filter((badge): badge is ProductBadgeImport => Boolean(badge));
      const galleryUrls = additionalUrls(row.additionalImageUrls);
      const imageUrl = row.productImageUrl || null;
      const status = (row.status || "DRAFT").toUpperCase() as (typeof productStatuses)[number];

      await prisma.product.create({
        data: {
          name: row.productName,
          slug: await uniqueSlug("product", row.slug || row.productName),
          description: row.description || "",
          brand: row.brand,
          price: Number(row.price).toFixed(2),
          discountPrice: row.discountPrice ? Number(row.discountPrice).toFixed(2) : null,
          stock: Number(row.stockQuantity),
          lowStockThreshold: row.lowStockThreshold ? Number(row.lowStockThreshold) : 5,
          status,
          badges,
          imageUrl,
          specifications: parseSpecifications(row.technicalSpecifications) as InputJsonValue | undefined,
          categoryId,
          media: {
            create: [
              ...(imageUrl ? [externalMediaData(imageUrl)] : []),
              ...galleryUrls.map((url) => externalMediaData(url)),
            ],
          },
        },
      });

      imported += 1;
    } catch (error) {
      errors.push({
        row: index + 2,
        identifier: row.slug || row.productName,
        errors: [error instanceof Error ? error.message : "Failed to import product."],
      });
    }
  }

  const history = await createImportHistory(adminId, "products", fileName, rows.length, imported, errors);
  return { imported, failed: rows.length - imported, totalRows: rows.length, errors, historyId: history.id };
}

function externalMediaData(url: string) {
  const fileType = url.match(/\.(mp4|mov|webm)(\?|$)/i) ? "video/external" : "image/external";

  return {
    url,
    fileName: url.split("/").pop()?.split("?")[0] || "external-media",
    fileType,
    fileSize: 0,
    storagePath: url,
    type: fileType.startsWith("video") ? "VIDEO" : "IMAGE",
  } as const;
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
