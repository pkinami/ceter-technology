import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import {
  type CategoryImportRow,
  type ImportKind,
  type PriceUpdateImportRow,
  type ProductImportRow,
  type StockUpdateImportRow,
  importCategories,
  importPriceUpdates,
  importProducts,
  importStockUpdates,
} from "@/lib/imports";
import { prisma } from "@/lib/prisma";

function isImportKind(value: unknown): value is ImportKind {
  return value === "products" || value === "categories" || value === "price-updates" || value === "stock-updates";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  const admin = await requirePermission("PRODUCTS", "BULK");

  try {
    const body: unknown = await request.json();

    if (!isRecord(body) || !isImportKind(body.kind) || !Array.isArray(body.rows)) {
      return NextResponse.json({ ok: false, message: "Invalid import request." }, { status: 400 });
    }

    const fileName = typeof body.fileName === "string" ? body.fileName : "bulk-import";
    const result =
      body.kind === "products"
        ? await importProducts(admin.id, fileName, body.rows as ProductImportRow[])
        : body.kind === "categories"
          ? await importCategories(admin.id, fileName, body.rows as CategoryImportRow[])
          : body.kind === "price-updates"
            ? await importPriceUpdates(admin.id, fileName, body.rows as PriceUpdateImportRow[])
            : await importStockUpdates(admin.id, fileName, body.rows as StockUpdateImportRow[]);

    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: `Imported ${result.imported} ${body.kind} from ${fileName}`,
      },
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/admin");
    revalidatePath("/admin/import");
    revalidatePath("/admin/products");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/pricing");
    revalidatePath("/admin/inventory");

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unable to import data." },
      { status: 400 },
    );
  }
}
