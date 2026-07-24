import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-logging";
import type { Product } from "@/types";

type ProductFindManyArgs = NonNullable<Parameters<typeof prisma.product.findMany>[0]>;
type ProductWhereInput = NonNullable<ProductFindManyArgs["where"]>;
type ProductOrderByInput = Prisma.ProductOrderByWithRelationInput;

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
} as const;

function getPublicProductRows(limit?: number) {
  return prisma.product.findMany({
    where: {
      status: "PUBLISHED",
    },
    include: publicProductInclude,
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: Math.min(Math.max(limit, 1), 200) } : {}),
  });
}

async function withCatalogueLogging<T>(
  operation: string,
  context: Record<string, unknown>,
  action: () => Promise<T>,
) {
  try {
    return await action();
  } catch (error) {
    logServerError("catalogue.load.failed", error, { operation, ...context });
    throw error;
  }
}

type ProductWithRelations = Awaited<ReturnType<typeof getPublicProductRows>>[number];

export type CatalogueCategory = {
  id: string;
  name: string;
  slug: string;
  parentName: string | null;
  productCount: number;
};

export type NavigationCategory = CatalogueCategory & {
  children: CatalogueCategory[];
};

export type CatalogueSearchParams = {
  q?: string;
  category?: string;
  brand?: string;
  stock?: "available" | "out";
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-low" | "price-high" | "name";
  page?: number;
  pageSize?: number;
};

export type CataloguePageResult = {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function stringifySpecs(value: unknown): Record<string, string> {
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
  if (product.stock <= 0) {
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
    sku: product.sku,
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
  const products = await withCatalogueLogging("getPublicProducts", {}, () => getPublicProductRows());

  return products.map(mapProduct);
}, ["public-products"], { tags: ["products", "catalogue"], revalidate: 300 });

export const getPublicProductShelf = unstable_cache(async (limit = 96) => {
  const products = await withCatalogueLogging("getPublicProductShelf", { limit }, () =>
    getPublicProductRows(limit),
  );

  return products.map(mapProduct);
}, ["public-product-shelf"], { tags: ["products", "catalogue"], revalidate: 300 });

export const getProductBySlug = unstable_cache(async (slug: string) => {
  const product = await withCatalogueLogging("getProductBySlug", { slug }, () =>
    prisma.product.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
      },
      include: publicProductInclude,
    }),
  );

  return product ? mapProduct(product) : null;
}, ["product-by-slug"], { tags: ["products", "catalogue"], revalidate: 300 });

export async function getRelatedProducts(product: Product, limit = 4) {
  const source = await withCatalogueLogging("getRelatedProducts.source", { productId: product.id }, () =>
    prisma.product.findUnique({
      where: { id: product.id },
      select: { categoryId: true, brand: true },
    }),
  );

  if (!source) {
    return [];
  }

  const related = await withCatalogueLogging("getRelatedProducts.products", { productId: product.id, limit }, () =>
    prisma.product.findMany({
      where: {
        id: { not: product.id },
        status: "PUBLISHED",
        OR: [
          { categoryId: source.categoryId },
          ...(source.brand ? [{ brand: { equals: source.brand, mode: "insensitive" as const } }] : []),
        ],
      },
      include: publicProductInclude,
      orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
      take: limit,
    }),
  );

  return related.map(mapProduct);
}

export const getCatalogueCategories = unstable_cache(async (): Promise<CatalogueCategory[]> => {
  const categories = await withCatalogueLogging("getCatalogueCategories", {}, () =>
    prisma.category.findMany({
      include: {
        parent: true,
        _count: {
          select: {
            products: {
              where: {
                status: {
                  equals: "PUBLISHED",
                },
              },
            },
          },
        },
      },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
    }),
  );

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentName: category.parent?.name ?? null,
    productCount: category._count.products,
  }));
}, ["catalogue-categories"], { tags: ["categories", "catalogue"], revalidate: 600 });

export const getCatalogueBrands = unstable_cache(async () => {
  const brands = await withCatalogueLogging("getCatalogueBrands", {}, () =>
    prisma.product.findMany({
      where: {
        status: {
          equals: "PUBLISHED",
        },
        NOT: { brand: "" },
      },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
  );

  return brands.map((product) => product.brand).filter(Boolean);
}, ["catalogue-brands"], { tags: ["products", "catalogue"], revalidate: 600 });

export async function getNavigationCategories(): Promise<NavigationCategory[]> {
  const categories = await getCatalogueCategories();
  const parents = categories
    .filter((category) => !category.parentName && category.productCount > 0)
    .map((category) => ({
      ...category,
      children: categories
        .filter((item) => item.parentName === category.name && item.productCount > 0)
        .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name));

  const childOnly = categories
    .filter(
      (category) =>
        category.parentName &&
        category.productCount > 0 &&
        !parents.some((parent) => parent.name === category.parentName),
    )
    .map((category) => ({ ...category, children: [] }));

  return [...parents, ...childOnly].slice(0, 14);
}

function cleanSearchTerm(value?: string) {
  return value?.trim().replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ") ?? "";
}

function normalizeNumber(value?: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function catalogueWhere(params: CatalogueSearchParams): ProductWhereInput {
  const query = cleanSearchTerm(params.q);
  const minPrice = normalizeNumber(params.minPrice);
  const maxPrice = normalizeNumber(params.maxPrice);
  const and: ProductWhereInput[] = [];

  if (params.type && params.type !== "All") {
    and.push({
      OR: [
        { name: { contains: params.type, mode: "insensitive" as const } },
        { description: { contains: params.type, mode: "insensitive" as const } },
        { category: { name: { contains: params.type, mode: "insensitive" as const } } },
      ],
    });
  }

  if (params.stock === "out") {
    and.push({ stock: { lte: 0 } });
  }

  if (query) {
    and.push({
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { brand: { contains: query, mode: "insensitive" as const } },
        { sku: { contains: query, mode: "insensitive" as const } },
        { description: { contains: query, mode: "insensitive" as const } },
        { category: { name: { contains: query, mode: "insensitive" as const } } },
        { category: { parent: { name: { contains: query, mode: "insensitive" as const } } } },
      ],
    });
  }

  return {
    status: "PUBLISHED",
    ...(and.length ? { AND: and } : {}),
    ...(params.brand && params.brand !== "All"
      ? { brand: { equals: params.brand, mode: "insensitive" as const } }
      : {}),
    ...(params.category && params.category !== "All"
      ? {
          category: {
            OR: [
              { name: { equals: params.category, mode: "insensitive" as const } },
              { slug: { equals: params.category, mode: "insensitive" as const } },
              { parent: { name: { equals: params.category, mode: "insensitive" as const } } },
              { parent: { slug: { equals: params.category, mode: "insensitive" as const } } },
            ],
          },
        }
      : {}),
    ...(params.stock === "available" ? { stock: { gt: 0 } } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };
}

function catalogueOrder(sort: CatalogueSearchParams["sort"]): ProductOrderByInput {
  if (sort === "price-low") return { price: "asc" };
  if (sort === "price-high") return { price: "desc" };
  if (sort === "name") return { name: "asc" };

  return { createdAt: "desc" };
}

export async function getCataloguePage(params: CatalogueSearchParams): Promise<CataloguePageResult> {
  const pageSize = Math.min(Math.max(params.pageSize ?? 24, 8), 48);
  const page = Math.max(params.page ?? 1, 1);
  const where = catalogueWhere(params);

  const total = await withCatalogueLogging("getCataloguePage.count", params, () =>
    prisma.product.count({ where }),
  );
  const products = await withCatalogueLogging("getCataloguePage.products", params, () =>
    prisma.product.findMany({
      where,
      include: publicProductInclude,
      orderBy: [catalogueOrder(params.sort), { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  );

  const pageCount = Math.max(Math.ceil(total / pageSize), 1);

  return {
    products: products.map(mapProduct),
    total,
    page: Math.min(page, pageCount),
    pageSize,
    pageCount,
  };
}

export async function getCatalogueFacets(params: CatalogueSearchParams = {}) {
  const where = catalogueWhere({ ...params, brand: undefined });
  const [categories, brands, price] = await withCatalogueLogging("getCatalogueFacets", params, () =>
    Promise.all([
      getCatalogueCategories(),
      prisma.product.groupBy({
        by: ["brand"],
        where: { ...where, NOT: { brand: "" } },
        _count: { _all: true },
        orderBy: { brand: "asc" },
      }),
      prisma.product.aggregate({
        where,
        _min: { price: true },
        _max: { price: true },
      }),
    ]),
  );

  return {
    categories,
    brands: brands.map((brand) => ({
      name: brand.brand,
      productCount: brand._count._all,
    })),
    minPrice: price._min.price ? Number(price._min.price) : 0,
    maxPrice: price._max.price ? Number(price._max.price) : 0,
  };
}
