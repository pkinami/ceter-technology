import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { categoryTemplateHeaders, priceUpdateTemplateHeaders, productTemplateHeaders, stockUpdateTemplateHeaders } from "@/lib/imports";

const productExample = [
  "HP LaserJet Pro M404dn",
  "HP",
  "M404dn",
  "SUP-HP-M404DN",
  "Printers",
  "Business laser printer",
  "Print technology: Laser; Speed: 40 ppm; Connectivity: USB, Ethernet",
  45000,
  10,
  "HP Inc.",
  "https://image-url.com/hp-front.jpg",
  "https://image-url.com/hp-side.jpg",
  "https://image-url.com/hp-detail.jpg",
  "1 year manufacturer warranty",
];

const categoryExample = [
  "Laser Printers",
  "laser-printers",
  "Printers",
  "High-speed business laser printers",
];

const priceUpdateExample = [
  "HP-M404DN",
  "hp-laserjet-pro-m404dn",
  "HP LaserJet Pro M404dn",
  42000,
  39900,
  "Supplier reduction",
];

const stockUpdateExample = [
  "HP-M404DN",
  "hp-laserjet-pro-m404dn",
  "HP LaserJet Pro M404dn",
  10,
  3,
  "Warehouse count adjustment",
];

export async function GET(_request: NextRequest, context: RouteContext<"/api/admin/import/template/[kind]">) {
  await requirePermission("PRODUCTS", "BULK");

  const { kind } = await context.params;
  const isProducts = kind === "products";
  const isCategories = kind === "categories";
  const isPriceUpdates = kind === "price-updates";
  const isStockUpdates = kind === "stock-updates";

  if (!isProducts && !isCategories && !isPriceUpdates && !isStockUpdates) {
    return new Response("Invalid template type.", { status: 404 });
  }

  const XLSX = await import("xlsx");
  const headers = isProducts
    ? productTemplateHeaders
    : isCategories
      ? categoryTemplateHeaders
      : isPriceUpdates
        ? priceUpdateTemplateHeaders
        : stockUpdateTemplateHeaders;
  const example = isProducts
    ? productExample
    : isCategories
      ? categoryExample
      : isPriceUpdates
        ? priceUpdateExample
        : stockUpdateExample;
  const worksheet = XLSX.utils.aoa_to_sheet([headers, example]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, isProducts ? "Products" : isCategories ? "Categories" : isPriceUpdates ? "Price Updates" : "Stock Updates");
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  const fileName = isProducts
    ? "Product Import Template.xlsx"
    : isCategories
      ? "Category Import Template.xlsx"
      : isPriceUpdates
        ? "Price Update Template.xlsx"
        : "Stock Update Template.xlsx";

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
