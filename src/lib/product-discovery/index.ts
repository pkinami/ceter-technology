import type { PrismaClient } from "@prisma/client";
import { collectManufacturerProducts } from "./collectors/manufacturers";
import { collectPublicCatalogueProducts } from "./collectors/public-catalogues";
import { findDuplicateProduct, findDuplicateSource } from "./duplicate-matcher";
import { enrichProduct } from "./enrichment";
import { collectProductImage } from "./images";
import { dedupeNormalizedProducts, normalizeProduct } from "./normalizer";
import { recommendKenyaPrice } from "./pricing";
import type { DiscoveryProgressReporter, DiscoveryRunResult, EnrichedProduct, PriceEvidence } from "./types";

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || crypto.randomUUID()
  );
}

async function uniqueSlug(prisma: PrismaClient, value: string) {
  const base = slugify(value);
  let slug = base;
  let index = 2;

  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${base}-${index}`;
    index += 1;
  }

  return slug;
}

async function ensureCategory(prisma: PrismaClient, path: string[]) {
  let parentId: string | null = null;
  let current = null as Awaited<ReturnType<typeof prisma.category.upsert>> | null;

  for (const name of path) {
    current = await prisma.category.upsert({
      where: { name },
      update: {
        parentId,
      },
      create: {
        name,
        slug: await uniqueCategorySlug(prisma, name),
        parentId,
      },
    });
    parentId = current.id;
  }

  if (!current) {
    throw new Error("Unable to resolve product category.");
  }

  return current;
}

async function uniqueCategorySlug(prisma: PrismaClient, value: string) {
  const base = slugify(value);
  let slug = base;
  let index = 2;

  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${base}-${index}`;
    index += 1;
  }

  return slug;
}

async function ensureManufacturer(prisma: PrismaClient, product: EnrichedProduct) {
  return prisma.manufacturer.upsert({
    where: { name: product.brand },
    update: {
      website: product.sourceKind === "manufacturer" ? new URL(product.sourceUrl).origin : undefined,
      categories: product.categoryPath,
    },
    create: {
      name: product.brand,
      slug: slugify(product.brand),
      website: product.sourceKind === "manufacturer" ? new URL(product.sourceUrl).origin : null,
      categories: product.categoryPath,
    },
  });
}

async function ensureDataSource(prisma: PrismaClient, product: EnrichedProduct, manufacturerId?: string | null) {
  return prisma.dataSource.upsert({
    where: {
      id: await dataSourceIdForName(prisma, product.sourceName),
    },
    update: {
      status: "ACTIVE",
      baseUrl: new URL(product.sourceUrl).origin,
      manufacturerId: product.sourceKind === "manufacturer" ? manufacturerId : null,
    },
    create: {
      name: product.sourceName,
      type: product.sourceKind === "manufacturer" ? "MANUFACTURER" : "RETAILER",
      connectionType: "WEB_CATALOGUE",
      country: product.sourceKind === "public_catalogue" ? "KENYA" : "INTERNATIONAL",
      updateFrequency: "DAILY",
      status: "ACTIVE",
      baseUrl: new URL(product.sourceUrl).origin,
      manufacturerId: product.sourceKind === "manufacturer" ? manufacturerId : null,
    },
  });
}

async function dataSourceIdForName(prisma: PrismaClient, name: string) {
  const source = await prisma.dataSource.findFirst({ where: { name }, select: { id: true } });

  return source?.id ?? `missing-${name}`;
}

function qualityIssues(product: EnrichedProduct, imageUrl: string | null, price: number | null) {
  return [
    product.title ? null : "Product title is missing.",
    product.brand ? null : "Brand is missing.",
    product.categoryName ? null : "Category is missing.",
    imageUrl ? null : "Image collection failed.",
    Object.keys(product.specifications).length > 0 ? null : "Specifications are missing.",
    price && price > 0 ? null : "Kenya price evidence is missing.",
  ].filter((item): item is string => Boolean(item));
}

function publicationStatus(issues: string[]) {
  return issues.length === 0 ? "ACTIVE" : "NEEDS_ATTENTION";
}

async function saveMarketPrice(
  prisma: PrismaClient,
  productId: string,
  price: NonNullable<ReturnType<typeof recommendKenyaPrice>>,
) {
  const values = price.evidence.map((item) => item.price);
  const lowest = Math.min(...values);
  const highest = Math.max(...values);

  await prisma.marketPriceIndex.upsert({
    where: { productId },
    update: {
      averageKenyaPrice: String(price.marketPrice),
      lowestMarketPrice: String(lowest),
      highestMarketPrice: String(highest),
      recommendedCeterPrice: String(price.recommendedPrice),
      sampleSize: price.evidence.length,
      sources: price.evidence,
    },
    create: {
      productId,
      averageKenyaPrice: String(price.marketPrice),
      lowestMarketPrice: String(lowest),
      highestMarketPrice: String(highest),
      recommendedCeterPrice: String(price.recommendedPrice),
      sampleSize: price.evidence.length,
      sources: price.evidence,
    },
  });

  await prisma.priceHistory.create({
    data: {
      productId,
      source: "Kenya public retail intelligence",
      marketPrice: String(price.marketPrice),
      recommendedPrice: String(price.recommendedPrice),
      targetMarginPercent: String(price.marginPercent),
      reason: `Public Kenya price evidence from ${price.evidence.length} source(s).`,
    },
  });
}

export async function runProductDiscoveryEngine(
  prisma: PrismaClient,
  reportProgress?: DiscoveryProgressReporter,
): Promise<DiscoveryRunResult> {
  await reportProgress?.({
    stage: "Connecting to data sources",
    progress: 5,
    totalItems: 0,
    completedItems: 0,
    errors: 0,
  });

  const [manufacturerResult, catalogueResult] = await Promise.all([
    collectManufacturerProducts(),
    collectPublicCatalogueProducts(),
  ]);
  const prices: PriceEvidence[] = catalogueResult.prices;
  const normalized = dedupeNormalizedProducts(
    [...manufacturerResult.products, ...catalogueResult.products].map(normalizeProduct),
  );
  const enriched = normalized.map(enrichProduct);
  const result: DiscoveryRunResult = {
    sourcesChecked: manufacturerResult.sourcesChecked + catalogueResult.sourcesChecked,
    productsDiscovered: enriched.length,
    productsUpdated: 0,
    productsCreated: 0,
    imagesCollected: 0,
    pricesUpdated: 0,
    errors: [...manufacturerResult.errors, ...catalogueResult.errors],
  };

  await reportProgress?.({
    stage: "Extracting products",
    progress: 18,
    totalItems: enriched.length,
    completedItems: 0,
    errors: result.errors.length,
  });

  for (const [index, product] of enriched.entries()) {
    try {
      await reportProgress?.({
        stage: `Processing ${product.brand} catalogue product`,
        progress: Math.min(92, 20 + Math.round((index / Math.max(enriched.length, 1)) * 70)),
        totalItems: enriched.length,
        completedItems: index,
        errors: result.errors.length,
      });

      const manufacturer = await ensureManufacturer(prisma, product);
      const dataSource = await ensureDataSource(prisma, product, manufacturer.id);
      const duplicateProduct = await findDuplicateProduct(prisma, product);
      const duplicateSource = await findDuplicateSource(prisma, product);
      const price = recommendKenyaPrice(product, prices);
      const existingImageUrl = duplicateSource?.imageUrls[0] ?? null;
      const collectedImage = duplicateSource?.imageVerified && duplicateSource.imageUrls[0]
        ? { originalUrl: duplicateSource.imageUrls[0], storageUrl: duplicateSource.imageUrls[0] }
        : await collectProductImage(product);
      const imageUrl = collectedImage?.storageUrl ?? existingImageUrl;
      const issues = qualityIssues(product, imageUrl, price?.recommendedPrice ?? null);
      const publishable = issues.length === 0 && Boolean(price && imageUrl);
      const productSource = duplicateSource
        ? await prisma.productSource.update({
            where: { id: duplicateSource.id },
            data: {
              productId: duplicateProduct?.id ?? duplicateSource.productId,
              sourceUrl: product.sourceUrl,
              name: product.title,
              modelNumber: product.modelNumber,
              sku: product.sku,
              categoryName: product.categoryName,
              description: product.description,
              specifications: product.specifications,
              imageUrls: imageUrl ? [imageUrl] : product.imageUrls,
              datasheetUrls: product.datasheetUrls ?? [],
              rawData: product.rawData ?? {},
              seoTitle: product.seoTitle,
              seoDescription: product.seoDescription,
              seoKeywords: product.seoKeywords,
              status: publishable ? "PUBLISHED" : "NEEDS_ATTENTION",
              imageVerified: Boolean(imageUrl),
            },
          })
        : await prisma.productSource.create({
            data: {
              productId: duplicateProduct?.id,
              dataSourceId: dataSource.id,
              manufacturerId: manufacturer.id,
              sourceProductId: product.normalizedSku ?? product.normalizedModel,
              sourceUrl: product.sourceUrl,
              name: product.title,
              modelNumber: product.modelNumber,
              sku: product.sku,
              brand: product.brand,
              categoryName: product.categoryName,
              description: product.description,
              specifications: product.specifications,
              imageUrls: imageUrl ? [imageUrl] : product.imageUrls,
              datasheetUrls: product.datasheetUrls ?? [],
              rawData: product.rawData ?? {},
              seoTitle: product.seoTitle,
              seoDescription: product.seoDescription,
              seoKeywords: product.seoKeywords,
              status: publishable ? "PUBLISHED" : "NEEDS_ATTENTION",
              imageVerified: Boolean(imageUrl),
            },
          });

      if (imageUrl) {
        result.imagesCollected += collectedImage ? 1 : 0;
        await prisma.imageSource.create({
          data: {
            productSourceId: productSource.id,
            dataSourceId: dataSource.id,
            url: collectedImage?.originalUrl ?? imageUrl,
            storageUrl: imageUrl,
            source: product.sourceKind === "manufacturer" ? "MANUFACTURER" : "APPROVED_RETAILER",
            isVerified: true,
          },
        });
      }

      let productId = duplicateProduct?.id ?? productSource.productId;

      if (!productId && publishable && price && imageUrl) {
        const category = await ensureCategory(prisma, product.categoryPath);
        const created = await prisma.product.create({
          data: {
            name: product.title,
            slug: await uniqueSlug(prisma, product.title),
            description: product.description,
            brand: product.brand,
            price: String(price.recommendedPrice),
            stock: 1,
            status: "ACTIVE",
            badges: ["NEW_ARRIVAL"],
            imageUrl,
            specifications: product.specifications,
            categoryId: category.id,
            sourceRecords: {
              connect: { id: productSource.id },
            },
            media: {
              create: {
                url: imageUrl,
                fileName: `${product.title} image`,
                fileType: "image/external",
                fileSize: 0,
                storagePath: "",
                type: "IMAGE",
              },
            },
          },
        });

        productId = created.id;
        result.productsCreated += 1;
      } else if (productId) {
        await prisma.product.update({
          where: { id: productId },
          data: {
            name: product.title,
            description: product.description,
            brand: product.brand,
            ...(price ? { price: String(price.recommendedPrice) } : {}),
            ...(imageUrl ? { imageUrl } : {}),
            specifications: product.specifications,
            status: publicationStatus(issues),
          },
        });
        result.productsUpdated += 1;
      }

      if (productId && price) {
        await saveMarketPrice(prisma, productId, price);
        result.pricesUpdated += 1;
      }

      await prisma.productDiscovery.create({
        data: {
          productSourceId: productSource.id,
          productId,
          dataSourceId: dataSource.id,
          detectedName: product.title,
          detectedBrand: product.brand,
          detectedCategory: product.categoryName,
          confidenceScore: duplicateProduct ? "98" : issues.length === 0 ? "90" : "60",
          status: duplicateProduct ? "EXISTING" : publishable ? "PUBLISHED" : "NEEDS_ATTENTION",
          notes: issues.join(" "),
          evidence: {
            sourceUrl: product.sourceUrl,
            imageUrl,
            priceEvidenceCount: price?.evidence.length ?? 0,
            duplicateProductId: duplicateProduct?.id ?? null,
          },
        },
      });

      await prisma.productQualityCheck.create({
        data: {
          productId,
          productSourceId: productSource.id,
          status: issues.length === 0 ? "PASSED" : "NEEDS_ATTENTION",
          hasName: Boolean(product.title),
          hasBrand: Boolean(product.brand),
          hasCategory: Boolean(product.categoryName),
          hasImage: Boolean(imageUrl),
          hasSpecifications: Object.keys(product.specifications).length > 0,
          hasPrice: Boolean(price),
          issues,
        },
      });
    } catch (error) {
      result.errors.push(`${product.name}: ${error instanceof Error ? error.message : "Unknown processing error"}`);
    }
  }

  await reportProgress?.({
    stage: "Publishing products",
    progress: 100,
    totalItems: enriched.length,
    completedItems: enriched.length,
    errors: result.errors.length,
  });

  return result;
}
