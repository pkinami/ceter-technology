export type ProductCategory =
  | "Printers"
  | "Ink & Toners"
  | "Printer Accessories"
  | "Office Equipment"
  | "IT Support Services";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  category: ProductCategory;
  subcategory: string;
  imageTone: "blue" | "orange" | "slate" | "cyan" | "green" | "violet";
  stock: number;
  availability: "In stock" | "Limited stock" | "Pre-order";
  specs: Record<string, string>;
  reviews: {
    name: string;
    rating: number;
    comment: string;
  }[];
  featured?: boolean;
};

export type CartItem = Product & {
  quantity: number;
};
