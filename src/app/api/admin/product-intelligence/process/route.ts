import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import {
  type ProductIntelligencePreview,
  processProductIntelligenceImport,
} from "@/lib/product-intelligence";

function isPreview(value: unknown): value is ProductIntelligencePreview {
  return Boolean(
    value &&
      typeof value === "object" &&
      "fileName" in value &&
      "fileType" in value &&
      "rows" in value &&
      Array.isArray((value as ProductIntelligencePreview).rows),
  );
}

export async function POST(request: NextRequest) {
  const admin = await requirePermission("PRODUCTS", "BULK");

  try {
    const body = await request.json();

    if (!isPreview(body.preview)) {
      return NextResponse.json({ ok: false, message: "Invalid product intelligence preview." }, { status: 400 });
    }

    const dataSourceId = typeof body.dataSourceId === "string" && body.dataSourceId.trim() ? body.dataSourceId.trim() : null;
    const result = await processProductIntelligenceImport({
      adminId: admin.id,
      dataSourceId,
      preview: body.preview,
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/admin");
    revalidatePath("/admin/automation");
    revalidatePath("/admin/products");
    revalidatePath("/admin/products/import-automation");

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unable to process products automatically." },
      { status: 400 },
    );
  }
}
