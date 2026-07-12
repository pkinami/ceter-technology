import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mapProduct } from "@/lib/catalog";

const searchInclude = {
  category: {
    include: {
      parent: true,
    },
  },
  media: {
    where: { type: "IMAGE" as const },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.ProductInclude;

export type ProductSearchFilters = {
  query?: string;
  brand?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: "available" | "out";
  limit?: number;
};

function cleanQuery(value?: string) {
  return value?.trim().replace(/[^a-zA-Z0-9\s-]/g, " ").replace(/\s+/g, " ") ?? "";
}

export async function searchProducts(filters: ProductSearchFilters) {
  const query = cleanQuery(filters.query);
  const limit = Math.min(Math.max(filters.limit ?? 36, 1), 100);
  const where: Prisma.ProductWhereInput = {
    status: { in: ["ACTIVE", "OUT_OF_STOCK"] },
    ...(filters.brand && filters.brand !== "All" ? { brand: { equals: filters.brand, mode: "insensitive" } } : {}),
    ...(filters.minPrice || filters.maxPrice
      ? {
          price: {
            ...(filters.minPrice ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice ? { lte: filters.maxPrice } : {}),
          },
        }
      : {}),
    ...(filters.availability === "available" ? { stock: { gt: 0 }, status: "ACTIVE" } : {}),
    ...(filters.availability === "out" ? { OR: [{ stock: { lte: 0 } }, { status: "OUT_OF_STOCK" }] } : {}),
    ...(filters.category && filters.category !== "All"
      ? {
          category: {
            OR: [
              { name: { equals: filters.category, mode: "insensitive" } },
              { parent: { name: { equals: filters.category, mode: "insensitive" } } },
            ],
          },
        }
      : {}),
  };

  if (!query) {
    const products = await prisma.product.findMany({
      where,
      include: searchInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return products.map(mapProduct);
  }

  const ranked = await prisma.$queryRaw<{ id: string }[]>`
    SELECT p.id
    FROM "Product" p
    JOIN "Category" c ON c.id = p."categoryId"
    WHERE p.status IN ('ACTIVE', 'OUT_OF_STOCK')
      AND to_tsvector('english', concat_ws(' ', p.name, p.brand, p.description, c.name))
        @@ websearch_to_tsquery('english', ${query})
    ORDER BY ts_rank_cd(
      to_tsvector('english', concat_ws(' ', p.name, p.brand, p.description, c.name)),
      websearch_to_tsquery('english', ${query})
    ) DESC, p."createdAt" DESC
    LIMIT ${limit}
  `;
  const ids = ranked.map((item) => item.id);

  if (ids.length === 0) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      ...where,
      id: { in: ids },
    },
    include: searchInclude,
  });
  const byId = new Map(products.map((product) => [product.id, product]));

  return ids.flatMap((id) => {
    const product = byId.get(id);

    return product ? [mapProduct(product)] : [];
  });
}
