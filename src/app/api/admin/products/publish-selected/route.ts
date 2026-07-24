import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { validateProductReadiness } from "@/lib/product-validation";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: Request) {
  const admin = await requirePermission("PRODUCTS", "BULK");
  const body: unknown = await request.json().catch(() => null);

  if (!isRecord(body) || !Array.isArray(body.productIds)) {
    return NextResponse.json({ ok: false, message: "Invalid publish request." }, { status: 400 });
  }

  const productIds = Array.from(new Set(body.productIds.filter((id): id is string => typeof id === "string" && id.trim() !== "")));
  if (productIds.length === 0) {
    return NextResponse.json({ ok: false, message: "Select at least one product to publish." }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, deletedAt: null, archivedAt: null },
    include: { media: { where: { type: "IMAGE", deletedAt: null }, orderBy: { createdAt: "asc" } } },
  });
  const skuCounts = new Map<string, number>();
  for (const product of await prisma.product.findMany({ where: { deletedAt: null, sku: { not: null } }, select: { sku: true } })) {
    const key = product.sku?.trim().toLowerCase();
    if (key) skuCounts.set(key, (skuCounts.get(key) ?? 0) + 1);
  }

  const failed: Array<{ id: string; name?: string; errors: string[] }> = [];
  const publishable = [];
  for (const product of products) {
    const duplicateSku = product.sku ? (skuCounts.get(product.sku.trim().toLowerCase()) ?? 0) > 1 : false;
    const readiness = validateProductReadiness(product, duplicateSku);
    if (product.status !== "DRAFT") {
      failed.push({ id: product.id, name: product.name, errors: ["Only Ready to Publish draft products can be published."] });
    } else if (!readiness.ready) {
      failed.push({ id: product.id, name: product.name, errors: readiness.issues.map((issue) => issue.message) });
    } else {
      publishable.push(product);
    }
  }

  for (const id of productIds) {
    if (!products.some((product) => product.id === id)) {
      failed.push({ id, errors: ["Product was not found or is archived/deleted."] });
    }
  }

  if (publishable.length > 0) {
    await prisma.product.updateMany({
      where: { id: { in: publishable.map((product) => product.id) }, status: "DRAFT" },
      data: { status: "PUBLISHED", version: { increment: 1 } } as never,
    });
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: `Published ${publishable.length} selected product${publishable.length === 1 ? "" : "s"}`,
      },
    });
    await prisma.auditLog.createMany({
      data: publishable.map((product) => ({
        actorId: admin.id,
        actorName: admin.name,
        action: "Published selected product",
        module: "products",
        entityType: "Product",
        entityId: product.id,
        metadata: { source: "admin-products-table" },
      })),
    });
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidateTag("products", "max");
  revalidateTag("catalogue", "max");

  return NextResponse.json({ ok: true, published: publishable.length, failed });
}
