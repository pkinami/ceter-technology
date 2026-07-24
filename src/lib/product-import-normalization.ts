export type ProductImportRowInput = {
  productName: string;
  brand: string;
  modelNumber: string;
  supplierSku: string;
  category: string;
  description: string;
  specifications: string;
  price: string;
  stock: string;
  manufacturer: string;
  productImage1Url: string;
  productImage2Url: string;
  productImage3Url: string;
  warranty: string;
};

export type StrictImportNumberResult =
  | { ok: true; value: number }
  | { ok: false; value: null; reason: "blank" | "malformed" | "non-finite" | "negative" };

export const productImportTemplateHeaders = [
  "Product Name",
  "Brand",
  "Model Number",
  "Supplier SKU",
  "Category",
  "Description",
  "Specifications",
  "Price",
  "Stock",
  "Manufacturer",
  "Product Image 1 URL",
  "Product Image 2 URL",
  "Product Image 3 URL (Optional)",
  "Warranty",
] as const;

const currencyPrefixPattern = /^KES\s+/i;
const plainNumberPattern = /^\d+(?:\.\d+)?$/;
const commaNumberPattern = /^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cell(row: Record<string, unknown>, key: string, ...fallbackKeys: string[]) {
  const normalized = new Map(Object.entries(row).map(([header, value]) => [normalizeHeader(header), value]));
  const value = row[key] ?? normalized.get(normalizeHeader(key)) ?? fallbackKeys.map((fallbackKey) => row[fallbackKey] ?? normalized.get(normalizeHeader(fallbackKey))).find((item) => item !== undefined);
  return value === undefined || value === null ? "" : String(value).trim();
}

export function normalizeProductImportRow(raw: Record<string, unknown>): ProductImportRowInput {
  return {
    productName: cell(raw, "Product Name"),
    brand: cell(raw, "Brand"),
    modelNumber: cell(raw, "Model Number"),
    supplierSku: cell(raw, "Supplier SKU"),
    category: cell(raw, "Category"),
    description: cell(raw, "Description"),
    specifications: cell(raw, "Specifications"),
    price: cell(raw, "Price"),
    stock: cell(raw, "Stock"),
    manufacturer: cell(raw, "Manufacturer"),
    productImage1Url: cell(raw, "Product Image 1 URL", "Product Image URL"),
    productImage2Url: cell(raw, "Product Image 2 URL"),
    productImage3Url: cell(raw, "Product Image 3 URL (Optional)", "Product Image 3 URL"),
    warranty: cell(raw, "Warranty"),
  };
}

export function normalizeStrictImportNumber(value: unknown): StrictImportNumberResult {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return { ok: false, value: null, reason: "non-finite" };
    if (value < 0) return { ok: false, value: null, reason: "negative" };
    return { ok: true, value };
  }

  if (typeof value !== "string") {
    return { ok: false, value: null, reason: "malformed" };
  }

  const trimmed = value.trim();
  if (!trimmed) return { ok: false, value: null, reason: "blank" };

  const withoutCurrency = trimmed.replace(currencyPrefixPattern, "").trim();
  if (!plainNumberPattern.test(withoutCurrency) && !commaNumberPattern.test(withoutCurrency)) {
    return { ok: false, value: null, reason: "malformed" };
  }

  const parsed = Number(withoutCurrency.replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return { ok: false, value: null, reason: "non-finite" };
  if (parsed < 0) return { ok: false, value: null, reason: "negative" };
  return { ok: true, value: parsed };
}

export function normalizeOptionalImportNumber(value: unknown) {
  const result = normalizeStrictImportNumber(value);
  return result.ok ? result : result.reason === "blank" ? ({ ok: true, value: null } as const) : result;
}

export function validateProductImportPricing(row: Pick<ProductImportRowInput, "price">) {
  const price = normalizeStrictImportNumber(row.price);
  const errors: string[] = [];

  if (!price.ok) {
    errors.push(price.reason === "blank" ? "Price is required." : "Price must be a valid number greater than zero.");
  } else if (price.value <= 0) {
    errors.push("Price must be greater than zero.");
  }

  return { price, errors };
}

export function validateRequiredProductImportHeaders(headers: string[]) {
  const normalized = new Set(headers.map(normalizeHeader));
  return productImportTemplateHeaders.filter((header) => !normalized.has(normalizeHeader(header)));
}
