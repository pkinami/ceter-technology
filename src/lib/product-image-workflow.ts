import { validateProductReadiness } from "./product-validation";

export type ProductPublicationMedia = {
  url?: string | null;
  deletedAt?: Date | string | null;
};

export type ProductPublicationCandidate = {
  name: string;
  brand: string;
  price: { toString(): string } | number | string;
  stock: number;
  categoryId: string | null;
  description?: string | null;
  modelNumber?: string | null;
  sku?: string | null;
  manufacturer?: string | null;
  specifications?: unknown;
  warranty?: string | null;
  media?: ProductPublicationMedia[];
  imageUrl?: string | null;
};

export function assertDiscountIsValid(price: number, discountPrice: number | null) {
  if (discountPrice !== null && discountPrice >= price) {
    throw new Error("Discount price must be lower than selling price.");
  }
}

export function assertProductCanUseStatus(product: ProductPublicationCandidate, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  if (status !== "PUBLISHED") return;
  const issues = validateProductReadiness(product).issues.map((issue) => issue.message);

  if (issues.length > 0) {
    throw new Error(`Product cannot be published: ${issues.join(" ")}`);
  }
}
