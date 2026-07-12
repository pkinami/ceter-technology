import type { PrismaClient } from "@prisma/client";
import type { EnrichedProduct } from "./types";

function compact(value?: string | null) {
  return value?.toUpperCase().replace(/[^A-Z0-9]/g, "") || null;
}

export async function findDuplicateProduct(prisma: PrismaClient, product: EnrichedProduct) {
  const model = compact(product.modelNumber);
  const sku = compact(product.sku);
  const brand = product.brand;

  const candidates = await prisma.product.findMany({
    where: {
      brand: {
        equals: brand,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      brand: true,
      specifications: true,
    },
    take: 100,
  });

  return candidates.find((candidate) => {
    const specs = candidate.specifications && typeof candidate.specifications === "object" && !Array.isArray(candidate.specifications)
      ? candidate.specifications as Record<string, unknown>
      : {};
    const candidateModel = compact(String(specs.Model ?? specs.model ?? candidate.name));
    const candidateSku = compact(String(specs.SKU ?? specs.sku ?? ""));

    return Boolean((model && candidateModel?.includes(model)) || (sku && (candidateSku === sku || candidate.name.toUpperCase().includes(sku))));
  }) ?? null;
}

export async function findDuplicateSource(prisma: PrismaClient, product: EnrichedProduct) {
  const conditions = [
    product.sku ? { sku: { equals: product.sku, mode: "insensitive" as const } } : null,
    product.modelNumber ? { modelNumber: { equals: product.modelNumber, mode: "insensitive" as const } } : null,
    { sourceUrl: product.sourceUrl },
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return prisma.productSource.findFirst({
    where: {
      brand: { equals: product.brand, mode: "insensitive" },
      OR: conditions,
    },
  });
}
