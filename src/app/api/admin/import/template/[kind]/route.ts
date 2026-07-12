import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/rbac";
import { categoryTemplateHeaders, productTemplateHeaders } from "@/lib/imports";

const productExample = [
  "HP LaserJet Pro M404dn",
  "hp-laserjet-pro-m404dn",
  "Business laser printer",
  "Laser Printers",
  "HP",
  45000,
  42000,
  10,
  5,
  "TRUE",
  "FALSE",
  "TRUE",
  "FALSE",
  "ACTIVE",
  "https://image-url.com/hp.jpg",
  "product-images/printers",
  "https://image-url.com/image2.jpg",
  "Speed: 40 ppm; Connectivity: USB, Ethernet",
];

const categoryExample = [
  "Laser Printers",
  "laser-printers",
  "Printers",
  "High-speed business laser printers",
];

export async function GET(_request: NextRequest, context: RouteContext<"/api/admin/import/template/[kind]">) {
  await requirePermission("PRODUCTS", "BULK");

  const { kind } = await context.params;
  const isProducts = kind === "products";
  const isCategories = kind === "categories";

  if (!isProducts && !isCategories) {
    return new Response("Invalid template type.", { status: 404 });
  }

  const XLSX = await import("xlsx");
  const headers = isProducts ? productTemplateHeaders : categoryTemplateHeaders;
  const example = isProducts ? productExample : categoryExample;
  const worksheet = XLSX.utils.aoa_to_sheet([headers, example]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, isProducts ? "Products" : "Categories");
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  const fileName = isProducts ? "Product Import Template.xlsx" : "Category Import Template.xlsx";

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
