export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  sku: string | null;
  price: number;
  discountPrice: number | null;
  category: string;
  subcategory: string;
  categoryPath: string;
  imageUrl: string | null;
  images: string[];
  stock: number;
  lowStockThreshold: number;
  availability: "In stock" | "Limited stock" | "Out of stock";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  badges: ("FEATURED" | "NEW_ARRIVAL" | "BEST_SELLER" | "PROMOTION")[];
  specs: Record<string, string>;
  createdAt: string;
};

export type CartItem = Product & {
  quantity: number;
};
