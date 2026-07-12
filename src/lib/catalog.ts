import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/types";

const publicProductInclude = {
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

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof publicProductInclude;
}>;

export type CatalogueCategory = {
  id: string;
  name: string;
  slug: string;
  parentName: string | null;
  productCount: number;
};

function stringifySpecs(value: Prisma.JsonValue | null): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [key, String(item ?? "")])
      .filter(([key, item]) => key.trim() && item.trim()),
  );
}

function stockLabel(product: ProductWithRelations): Product["availability"] {
  if (product.status === "OUT_OF_STOCK" || product.stock <= 0) {
    return "Out of stock";
  }

  if (product.stock <= product.lowStockThreshold) {
    return "Limited stock";
  }

  return "In stock";
}

export function mapProduct(product: ProductWithRelations): Product {
  const category = product.category.parent?.name ?? product.category.name;
  const subcategory = product.category.parent ? product.category.name : product.category.name;
  const images = Array.from(
    new Set([product.imageUrl, ...product.media.map((item) => item.url)].filter(Boolean)),
  ) as string[];

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    description: product.description,
    price: Number(product.price),
    discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
    category,
    subcategory,
    categoryPath: product.category.parent
      ? `${product.category.parent.name} / ${product.category.name}`
      : product.category.name,
    imageUrl: images[0] ?? null,
    images,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    availability: stockLabel(product),
    status: product.status,
    badges: product.badges,
    specs: stringifySpecs(product.specifications),
    createdAt: product.createdAt.toISOString(),
  };
}

export const getPublicProducts = unstable_cache(async () => {
  const products = await prisma.product.findMany({
    where: {
      status: {
        in: ["ACTIVE", "OUT_OF_STOCK"],
      },
    },
    include: publicProductInclude,
    orderBy: { createdAt: "desc" },
  });

  return products.map(mapProduct);
}, ["public-products"], { tags: ["products", "catalogue"], revalidate: 300 });

export const getPublicProductShelf = unstable_cache(async (limit = 96) => {
  const products = await prisma.product.findMany({
    where: {
      status: {
        in: ["ACTIVE", "OUT_OF_STOCK"],
      },
    },
    include: publicProductInclude,
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });

  return products.map(mapProduct);
}, ["public-product-shelf"], { tags: ["products", "catalogue"], revalidate: 300 });

export const getProductBySlug = unstable_cache(async (slug: string) => {
  const product = await prisma.product.findFirst({
    where: {
      slug,
      status: {
        in: ["ACTIVE", "OUT_OF_STOCK"],
      },
    },
    include: publicProductInclude,
  });

  return product ? mapProduct(product) : null;
}, ["product-by-slug"], { tags: ["products", "catalogue"], revalidate: 300 });

export async function getRelatedProducts(product: Product, limit = 4) {
  const source = await prisma.product.findUnique({
    where: { id: product.id },
    select: { categoryId: true, brand: true },
  });

  if (!source) {
    return [];
  }

  const related = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      status: { in: ["ACTIVE", "OUT_OF_STOCK"] },
      OR: [
        { categoryId: source.categoryId },
        ...(source.brand ? [{ brand: { equals: source.brand, mode: "insensitive" as const } }] : []),
      ],
    },
    include: publicProductInclude,
    orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return related.map(mapProduct);
}

export const getCatalogueCategories = unstable_cache(async (): Promise<CatalogueCategory[]> => {
  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      _count: {
        select: {
          products: {
            where: {
              status: {
                in: ["ACTIVE", "OUT_OF_STOCK"],
              },
            },
          },
        },
      },
    },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentName: category.parent?.name ?? null,
    productCount: category._count.products,
  }));
}, ["catalogue-categories"], { tags: ["categories", "catalogue"], revalidate: 600 });

export const getCatalogueBrands = unstable_cache(async () => {
  const brands = await prisma.product.findMany({
    where: {
      status: {
        in: ["ACTIVE", "OUT_OF_STOCK"],
      },
      NOT: { brand: "" },
    },
    select: { brand: true },
    distinct: ["brand"],
    orderBy: { brand: "asc" },
  });

  return brands.map((product) => product.brand).filter(Boolean);
}, ["catalogue-brands"], { tags: ["products", "catalogue"], revalidate: 600 });
