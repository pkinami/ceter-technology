export type ProductValidationMedia = {
  url?: string | null;
  deletedAt?: Date | string | null;
};

export type ProductValidationCandidate = {
  id?: string;
  name?: string | null;
  brand?: string | null;
  modelNumber?: string | null;
  sku?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  description?: string | null;
  specifications?: unknown;
  price?: { toString(): string } | number | string | null;
  stock?: number | null;
  manufacturer?: string | null;
  imageUrl?: string | null;
  media?: ProductValidationMedia[];
  warranty?: string | null;
  status?: string | null;
};

export type ProductValidationIssue = {
  field: string;
  message: string;
};

export type ProductDisplayStatus = "Ready to Publish" | "Has Errors" | "Published" | "Draft";

function present(value: unknown) {
  return typeof value === "string" ? value.trim().length > 0 : value !== null && value !== undefined;
}

export function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function specificationText(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") return Object.keys(value).length > 0 ? JSON.stringify(value) : "";
  return "";
}

export function productImageUrls(product: Pick<ProductValidationCandidate, "imageUrl" | "media">) {
  return Array.from(
    new Set([product.imageUrl, ...(product.media ?? []).filter((item) => !item.deletedAt).map((item) => item.url)].filter((url): url is string => typeof url === "string" && url.trim() !== "")),
  );
}

export function validateProductReadiness(product: ProductValidationCandidate, duplicateSku = false) {
  const issues: ProductValidationIssue[] = [];
  const price = Number(product.price);
  const images = productImageUrls(product);
  const image1 = images[0] ?? "";
  const image2 = images[1] ?? "";
  const image3 = images[2] ?? "";

  if (!present(product.name)) issues.push({ field: "Product Name", message: "Product Name is required." });
  if (!present(product.brand)) issues.push({ field: "Brand", message: "Brand is required." });
  if (!present(product.modelNumber)) issues.push({ field: "Model Number", message: "Model Number is required." });
  if (!present(product.sku)) issues.push({ field: "Supplier SKU", message: "Supplier SKU is required." });
  if (duplicateSku) issues.push({ field: "Supplier SKU", message: "Supplier SKU must be unique." });
  if (!present(product.categoryId) && !present(product.categoryName)) issues.push({ field: "Category", message: "Category is required." });
  if (!present(product.description)) issues.push({ field: "Description", message: "Description is required." });
  if (!specificationText(product.specifications)) issues.push({ field: "Specifications", message: "Specifications are required." });
  if (!Number.isFinite(price) || price <= 0) issues.push({ field: "Price", message: "Price must be a valid number greater than zero." });
  if (!Number.isInteger(product.stock) || Number(product.stock) < 0) issues.push({ field: "Stock", message: "Stock must be a valid whole number of zero or greater." });
  if (!present(product.manufacturer)) issues.push({ field: "Manufacturer", message: "Manufacturer is required." });
  if (!image1) issues.push({ field: "Product Image 1 URL", message: "Product Image 1 URL is required." });
  else if (!isValidUrl(image1)) issues.push({ field: "Product Image 1 URL", message: "Product Image 1 URL must be a valid http or https URL." });
  if (!image2) issues.push({ field: "Product Image 2 URL", message: "Product Image 2 URL is required." });
  else if (!isValidUrl(image2)) issues.push({ field: "Product Image 2 URL", message: "Product Image 2 URL must be a valid http or https URL." });
  if (image3 && !isValidUrl(image3)) issues.push({ field: "Product Image 3 URL", message: "Product Image 3 URL must be a valid http or https URL." });
  if (!present(product.warranty)) issues.push({ field: "Warranty", message: "Warranty is required." });

  return {
    ready: issues.length === 0,
    issues,
  };
}

export function productDisplayStatus(product: ProductValidationCandidate, duplicateSku = false): ProductDisplayStatus {
  if (product.status === "PUBLISHED") return "Published";
  const readiness = validateProductReadiness(product, duplicateSku);
  if (readiness.ready) return "Ready to Publish";
  return "Has Errors";
}

export function duplicateImportSkuKey(value: string) {
  return value.trim().toLowerCase();
}
