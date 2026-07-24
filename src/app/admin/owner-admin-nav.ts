export type OwnerNavIcon = "boxes" | "clipboard-list" | "file-spreadsheet" | "images" | "layout-dashboard" | "settings" | "tags" | "users";

export type OwnerNavItem = {
  href: string;
  label: string;
  description: string;
  icon: OwnerNavIcon;
};

export const ownerAdminNav: OwnerNavItem[] = [
  { href: "/admin", label: "Dashboard", description: "Operational overview", icon: "layout-dashboard" },
  { href: "/admin/products", label: "Products", description: "Catalogue records", icon: "boxes" },
  { href: "/admin/categories", label: "Categories", description: "Category management", icon: "tags" },
  { href: "/admin/brands", label: "Brands", description: "Brand management", icon: "users" },
  { href: "/admin/import", label: "Imports", description: "Excel product uploads", icon: "file-spreadsheet" },
  { href: "/admin/media", label: "Media", description: "Product image library", icon: "images" },
  { href: "/admin/orders", label: "Orders", description: "Customer orders", icon: "clipboard-list" },
  { href: "/admin/settings", label: "Settings", description: "Admin configuration", icon: "settings" },
];
