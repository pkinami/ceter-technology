"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import type { Prisma } from "@prisma/client";
import type { InputJsonValue } from "@prisma/client/runtime/client.js";
import { logAudit, requirePermission } from "@/lib/rbac";
import { MEDIA_BUCKETS, bucketFromForm, deleteMediaObject, fileNameFromUrl, folderFromForm, inferMediaType, storagePathFromPublicUrl, uploadMediaFile } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { assertDiscountIsValid, assertProductCanUseStatus } from "@/lib/product-image-workflow";

const productStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const productBadges = ["FEATURED", "NEW_ARRIVAL", "BEST_SELLER", "PROMOTION"] as const;
const orderStatuses = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
const deliveryStatuses = ["PENDING", "READY_FOR_DISPATCH", "IN_TRANSIT", "DELIVERED", "FAILED", "RETURNED"] as const;

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${key} is required.`);
  return value.trim();
}

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function requiredNumber(formData: FormData, key: string) {
  const value = Number(requiredString(formData, key));
  if (!Number.isFinite(value) || value < 0) throw new Error(`${key} must be a valid positive number.`);
  return value;
}

function optionalDecimalNumber(formData: FormData, key: string) {
  const value = optionalString(formData, key);
  if (!value) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${key} must be a valid positive number.`);
  return number;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || crypto.randomUUID();
}

async function uniqueSlug(model: "category" | "product", value: string, id?: string) {
  const base = slugify(value);
  let slug = base;
  let index = 2;
  while (true) {
    const match = model === "category" ? await prisma.category.findUnique({ where: { slug } }) : await prisma.product.findUnique({ where: { slug } });
    if (!match || match.id === id) return slug;
    slug = `${base}-${index}`;
    index += 1;
  }
}

function parseSpecifications(value: string | null) {
  if (!value) return undefined;
  return Object.fromEntries(
    value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
      const [key, ...rest] = line.split(":");
      return [key.trim(), rest.join(":").trim()];
    }).filter(([key, value]) => key && value),
  );
}

function badgesFromForm(formData: FormData) {
  return formData.getAll("badges").filter((value): value is (typeof productBadges)[number] => typeof value === "string" && productBadges.includes(value as (typeof productBadges)[number]));
}

function productStatusFromForm(formData: FormData) {
  const status = requiredString(formData, "status");
  if (!productStatuses.includes(status as (typeof productStatuses)[number])) {
    throw new Error("Invalid product status.");
  }
  return status as (typeof productStatuses)[number];
}

function orderStatusFromForm(formData: FormData) {
  const status = requiredString(formData, "status");
  if (!orderStatuses.includes(status as (typeof orderStatuses)[number])) {
    throw new Error("Invalid order status.");
  }
  return status as (typeof orderStatuses)[number];
}

function deliveryStatusFromForm(formData: FormData) {
  const status = requiredString(formData, "deliveryStatus");
  if (!deliveryStatuses.includes(status as (typeof deliveryStatuses)[number])) {
    throw new Error("Invalid delivery status.");
  }
  return status as (typeof deliveryStatuses)[number];
}

function externalMediaData(url: string, productId?: string | null) {
  const fileType = url.match(/\.(mp4|mov|webm)(\?|$)/i) ? "video/external" : "image/external";
  return {
    productId: productId || null,
    url,
    fileName: fileNameFromUrl(url),
    fileType,
    fileSize: 0,
    storagePath: storagePathFromPublicUrl(url),
    type: inferMediaType(fileType),
  };
}

function imageUrlsFromForm(formData: FormData) {
  return ["imageUrl", "productImage2Url", "productImage3Url"]
    .map((key) => optionalString(formData, key))
    .filter((url): url is string => Boolean(url));
}

async function assertSkuIsUnique(sku: string | null, productId?: string) {
  if (!sku) return;
  const duplicate = await prisma.product.findFirst({
    where: {
      sku: { equals: sku, mode: "insensitive" },
      deletedAt: null,
      ...(productId ? { id: { not: productId } } : {}),
    },
    select: { id: true, name: true },
  });
  if (duplicate) {
    throw new Error(`Supplier SKU must be unique. "${sku}" is already used by ${duplicate.name}.`);
  }
}

async function uploadImagesFromForm(formData: FormData, key: string, productId?: string) {
  const files = formData.getAll(key);
  const media = [];
  for (const file of files) {
    if (file instanceof File && file.size > 0) {
      const uploaded = await uploadMediaFile({ file, bucket: MEDIA_BUCKETS.productImages, folder: "printers", productId });
      if (uploaded) media.push(uploaded);
    }
  }
  return media;
}

async function logAdminAction(adminId: string, action: string) {
  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { name: true } });
  await prisma.adminLog.create({ data: { adminId, action } });
  await logAudit({ actorId: adminId, actorName: admin?.name, action, module: "admin" });
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/brands");
  revalidatePath("/admin/import");
  revalidatePath("/admin/media");
  revalidatePath("/admin/orders");
  revalidateTag("products", "max");
  revalidateTag("categories", "max");
  revalidateTag("catalogue", "max");
}

function revalidateCatalogue(slug?: string) {
  revalidateTag("products", "max");
  revalidateTag("catalogue", "max");
  revalidatePath("/");
  revalidatePath("/products");
  if (slug) revalidatePath(`/products/${slug}`);
}

function productWhereFromForm(formData: FormData): Prisma.ProductWhereInput {
  const q = optionalString(formData, "q");
  const status = optionalString(formData, "filterStatus");
  const categoryId = optionalString(formData, "categoryId");
  const brand = optionalString(formData, "brand");
  const archived = optionalString(formData, "archived");
  const deleted = optionalString(formData, "deleted");

  return {
    ...(deleted === "true" ? { deletedAt: { not: null } } : { deletedAt: null }),
    ...(deleted !== "true" ? (archived === "true" ? { archivedAt: { not: null } } : { archivedAt: null }) : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }, { brand: { contains: q, mode: "insensitive" } }] } : {}),
    ...(status && productStatuses.includes(status as (typeof productStatuses)[number]) ? { status: status as (typeof productStatuses)[number] } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(brand ? { brand } : {}),
  };
}

async function permanentlyDeleteProducts(ids: string[]) {
  const productIds = Array.from(new Set(ids.filter(Boolean)));
  if (productIds.length === 0) return 0;
  for (const media of await prisma.media.findMany({ where: { productId: { in: productIds } } })) {
    try {
      await deleteMediaObject(media.id);
    } catch {}
  }
  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { productId: { in: productIds } } }),
    prisma.productView.deleteMany({ where: { productId: { in: productIds } } }),
    prisma.inventoryLog.deleteMany({ where: { productId: { in: productIds } } }),
    prisma.stockMovement.deleteMany({ where: { productId: { in: productIds } } }),
    prisma.priceHistory.deleteMany({ where: { productId: { in: productIds } } }),
    prisma.marketPriceIndex.deleteMany({ where: { productId: { in: productIds } } }),
    prisma.marketingCampaignProduct.deleteMany({ where: { productId: { in: productIds } } }),
    prisma.quoteRequest.updateMany({ where: { productId: { in: productIds } }, data: { productId: null, version: { increment: 1 } } as never }),
    prisma.supplierProduct.updateMany({ where: { productId: { in: productIds } }, data: { productId: null, version: { increment: 1 } } as never }),
  ]);
  return (await prisma.product.deleteMany({ where: { id: { in: productIds } } })).count;
}

export async function createCategory(formData: FormData) {
  const admin = await requirePermission("CATEGORIES", "CREATE");
  const category = await prisma.category.create({
    data: {
      name: requiredString(formData, "name"),
      slug: await uniqueSlug("category", requiredString(formData, "name")),
      parentId: optionalString(formData, "parentId"),
      description: optionalString(formData, "description"),
      sortOrder: Number(optionalString(formData, "sortOrder") ?? 0),
    },
  });
  await logAdminAction(admin.id, `Created category: ${category.name}`);
  revalidateAdmin();
}

export async function updateCategory(formData: FormData) {
  const admin = await requirePermission("CATEGORIES", "EDIT");
  const category = await prisma.category.update({
    where: { id: requiredString(formData, "categoryId") },
    data: {
      name: requiredString(formData, "name"),
      slug: await uniqueSlug("category", requiredString(formData, "name"), requiredString(formData, "categoryId")),
      parentId: optionalString(formData, "parentId"),
      description: optionalString(formData, "description"),
      sortOrder: Number(optionalString(formData, "sortOrder") ?? 0),
    },
  });
  await logAdminAction(admin.id, `Updated category: ${category.name}`);
  revalidateAdmin();
}

export async function deleteCategory(formData: FormData) {
  const admin = await requirePermission("CATEGORIES", "DELETE");
  const categoryId = requiredString(formData, "categoryId");
  const productIds = (await prisma.product.findMany({ where: { categoryId }, select: { id: true } })).map((product) => product.id);
  await permanentlyDeleteProducts(productIds);
  const category = await prisma.category.delete({ where: { id: categoryId } });
  await logAdminAction(admin.id, `Deleted category: ${category.name}`);
  revalidateAdmin();
  revalidateCatalogue();
}

export async function createBrand(formData: FormData) {
  const admin = await requirePermission("PRODUCTS", "EDIT");
  const brand = await prisma.brand.create({ data: { name: requiredString(formData, "name"), website: optionalString(formData, "website"), isActive: true, sortOrder: Number(optionalString(formData, "sortOrder") ?? 0) } });
  await logAdminAction(admin.id, `Created brand: ${brand.name}`);
  revalidateAdmin();
}

export async function updateBrand(formData: FormData) {
  const admin = await requirePermission("PRODUCTS", "EDIT");
  const brand = await prisma.brand.update({
    where: { id: requiredString(formData, "brandId") },
    data: { name: requiredString(formData, "name"), website: optionalString(formData, "website"), isActive: formData.get("isActive") === "on", sortOrder: Number(optionalString(formData, "sortOrder") ?? 0) },
  });
  await logAdminAction(admin.id, `Updated brand: ${brand.name}`);
  revalidateAdmin();
}

export async function deleteBrand(formData: FormData) {
  const admin = await requirePermission("PRODUCTS", "DELETE");
  const brand = await prisma.brand.delete({ where: { id: requiredString(formData, "brandId") } });
  await logAdminAction(admin.id, `Deleted brand: ${brand.name}`);
  revalidateAdmin();
}

export async function createProduct(formData: FormData) {
  const admin = await requirePermission("PRODUCTS", "CREATE");
  const name = requiredString(formData, "name");
  const priceNumber = requiredNumber(formData, "price");
  const discountNumber = optionalDecimalNumber(formData, "discountPrice");
  assertDiscountIsValid(priceNumber, discountNumber);
  const stock = requiredNumber(formData, "stock");
  const status = productStatusFromForm(formData);
  const categoryId = requiredString(formData, "categoryId");
  const sku = optionalString(formData, "sku");
  await assertSkuIsUnique(sku);
  const imageFile = formData.get("image");
  const uploadedImage = imageFile instanceof File && imageFile.size > 0 ? await uploadMediaFile({ file: imageFile, bucket: MEDIA_BUCKETS.productImages, folder: "printers" }) : null;
  const imageUrl = uploadedImage?.url ?? optionalString(formData, "imageUrl");
  const galleryUrls = [
    ...imageUrlsFromForm(formData).filter((url) => url !== imageUrl),
    ...(optionalString(formData, "galleryImageUrls") ?? "").split(/\r?\n/).map((url) => url.trim()).filter(Boolean),
  ];
  assertProductCanUseStatus({
    name,
    brand: optionalString(formData, "brand") ?? "",
    modelNumber: optionalString(formData, "modelNumber"),
    sku,
    description: requiredString(formData, "description"),
    specifications: parseSpecifications(optionalString(formData, "specifications")),
    price: priceNumber,
    stock,
    manufacturer: optionalString(formData, "manufacturer"),
    warranty: optionalString(formData, "warranty"),
    categoryId,
    imageUrl,
    media: galleryUrls.map((url) => ({ url })),
  }, status);
  const product = await prisma.product.create({
    data: {
      name,
      slug: await uniqueSlug("product", optionalString(formData, "slug") ?? name),
      description: requiredString(formData, "description"),
      sku,
      modelNumber: optionalString(formData, "modelNumber"),
      manufacturer: optionalString(formData, "manufacturer"),
      manufacturerProductUrl: optionalString(formData, "manufacturerProductUrl"),
      datasheetUrl: optionalString(formData, "datasheetUrl"),
      warranty: optionalString(formData, "warranty"),
      barcode: optionalString(formData, "barcode"),
      brand: optionalString(formData, "brand") ?? "",
      price: priceNumber.toFixed(2),
      discountPrice: discountNumber === null ? null : discountNumber.toFixed(2),
      stock,
      lowStockThreshold: Number(optionalString(formData, "lowStockThreshold") ?? 5),
      status,
      badges: badgesFromForm(formData),
      imageUrl,
      imageFolder: null,
      homepagePlacement: optionalString(formData, "homepagePlacement"),
      specifications: parseSpecifications(optionalString(formData, "specifications")),
      categoryId,
      media: { create: [...(!uploadedImage && imageUrl ? [externalMediaData(imageUrl)] : []), ...galleryUrls.map((url) => externalMediaData(url))] },
    },
  });
  await prisma.media.updateMany({ where: { id: { in: [uploadedImage?.id].filter(Boolean) as string[] } }, data: { productId: product.id } });
  await logAdminAction(admin.id, `Created product: ${product.name}`);
  revalidateAdmin();
  revalidateCatalogue(product.slug);
}

export async function updateProduct(formData: FormData) {
  const admin = await requirePermission("PRODUCTS", "EDIT");
  const productId = requiredString(formData, "productId");
  const name = requiredString(formData, "name");
  const priceNumber = requiredNumber(formData, "price");
  const discountNumber = optionalDecimalNumber(formData, "discountPrice");
  assertDiscountIsValid(priceNumber, discountNumber);
  const stock = requiredNumber(formData, "stock");
  const status = productStatusFromForm(formData);
  const categoryId = requiredString(formData, "categoryId");
  const sku = optionalString(formData, "sku");
  await assertSkuIsUnique(sku, productId);
  const previousProduct = await prisma.product.findUnique({ where: { id: productId }, select: { imageUrl: true, media: true, slug: true } });
  const imageFile = formData.get("image");
  const uploadedImage = imageFile instanceof File && imageFile.size > 0 ? await uploadMediaFile({ file: imageFile, bucket: MEDIA_BUCKETS.productImages, folder: "printers", productId }) : null;
  const imageUrl = uploadedImage?.url ?? optionalString(formData, "imageUrl");
  await uploadImagesFromForm(formData, "galleryImages", productId);
  const existingMediaUrls = new Set((previousProduct?.media ?? []).map((item) => item.url));
  const galleryUrls = [
    ...imageUrlsFromForm(formData).filter((url) => url !== imageUrl),
    ...(optionalString(formData, "galleryImageUrls") ?? "").split(/\r?\n/).map((url) => url.trim()).filter(Boolean),
  ].filter((url) => !existingMediaUrls.has(url));
  assertProductCanUseStatus({
    name,
    brand: optionalString(formData, "brand") ?? "",
    modelNumber: optionalString(formData, "modelNumber"),
    sku,
    description: requiredString(formData, "description"),
    specifications: parseSpecifications(optionalString(formData, "specifications")),
    price: priceNumber,
    stock,
    manufacturer: optionalString(formData, "manufacturer"),
    warranty: optionalString(formData, "warranty"),
    categoryId,
    imageUrl,
    media: galleryUrls.map((url) => ({ url })),
  }, status);
  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      name,
      slug: await uniqueSlug("product", optionalString(formData, "slug") ?? name, productId),
      description: requiredString(formData, "description"),
      sku,
      modelNumber: optionalString(formData, "modelNumber"),
      manufacturer: optionalString(formData, "manufacturer"),
      manufacturerProductUrl: optionalString(formData, "manufacturerProductUrl"),
      datasheetUrl: optionalString(formData, "datasheetUrl"),
      warranty: optionalString(formData, "warranty"),
      barcode: optionalString(formData, "barcode"),
      brand: optionalString(formData, "brand") ?? "",
      price: priceNumber.toFixed(2),
      discountPrice: discountNumber === null ? null : discountNumber.toFixed(2),
      stock,
      lowStockThreshold: Number(optionalString(formData, "lowStockThreshold") ?? 5),
      status,
      badges: badgesFromForm(formData),
      imageUrl,
      homepagePlacement: optionalString(formData, "homepagePlacement"),
      specifications: parseSpecifications(optionalString(formData, "specifications")),
      categoryId,
      media: { create: [...(!uploadedImage && imageUrl && imageUrl !== previousProduct?.imageUrl ? [externalMediaData(imageUrl)] : []), ...galleryUrls.map((url) => externalMediaData(url))] },
    },
  });
  await prisma.media.updateMany({ where: { id: { in: [uploadedImage?.id].filter(Boolean) as string[] } }, data: { productId: product.id } });
  await logAdminAction(admin.id, `Updated product: ${product.name}`);
  revalidateAdmin();
  revalidateCatalogue(product.slug);
}

export async function bulkUpdateProducts(formData: FormData) {
  const admin = await requirePermission("PRODUCTS", "BULK");
  let productIds = formData.getAll("productIds").filter((value): value is string => typeof value === "string" && value.trim() !== "");
  const operation = requiredString(formData, "operation");
  const where = formData.get("selectionMode") === "allFiltered" ? productWhereFromForm(formData) : { id: { in: productIds } };
  if (formData.get("selectionMode") === "allFiltered") {
    const products = await prisma.product.findMany({ where, select: { id: true } });
    productIds = products.map((product) => product.id);
  }
  if (productIds.length === 0) throw new Error("Select at least one product.");

  if (operation === "delete") {
    await requirePermission("PRODUCTS", "DELETE");
    await permanentlyDeleteProducts(productIds);
  } else if (operation === "price") {
    await requirePermission("PRODUCTS", "EDIT");
    const price = requiredString(formData, "price");
    await prisma.product.updateMany({ where: { id: { in: productIds } }, data: { price } });
  } else if (operation === "stock") {
    await requirePermission("PRODUCTS", "EDIT");
    const stock = requiredNumber(formData, "stock");
    await prisma.product.updateMany({ where: { id: { in: productIds } }, data: { stock } });
  } else if (operation === "status") {
    await requirePermission("PRODUCTS", "EDIT");
    const status = productStatusFromForm(formData);
    await prisma.product.updateMany({ where: { id: { in: productIds } }, data: { status } });
  } else if (operation === "category") {
    await requirePermission("PRODUCTS", "EDIT");
    const categoryId = requiredString(formData, "targetCategoryId");
    await prisma.product.updateMany({ where: { id: { in: productIds } }, data: { categoryId, version: { increment: 1 } } as never });
  } else if (operation === "brand") {
    await requirePermission("PRODUCTS", "EDIT");
    const brand = requiredString(formData, "targetBrand");
    await prisma.product.updateMany({ where: { id: { in: productIds } }, data: { brand, version: { increment: 1 } } as never });
  } else if (operation === "promotion") {
    await requirePermission("PRODUCTS", "EDIT");
    const enabled = requiredString(formData, "promotionState") === "on";
    const previousProducts = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, badges: true } });
    await prisma.$transaction(previousProducts.map((product) => {
      const badges = new Set(product.badges);
      if (enabled) badges.add("PROMOTION"); else badges.delete("PROMOTION");
      return prisma.product.update({ where: { id: product.id }, data: { badges: Array.from(badges), version: { increment: 1 } } as never });
    }));
  } else if (operation === "archive") {
    await prisma.product.updateMany({ where: { id: { in: productIds }, deletedAt: null } as never, data: { archivedAt: new Date(), status: "ARCHIVED", version: { increment: 1 } } as never });
  } else if (operation === "restore") {
    await prisma.product.updateMany({ where: { id: { in: productIds }, deletedAt: null } as never, data: { archivedAt: null, status: "DRAFT", version: { increment: 1 } } as never });
  } else {
    throw new Error("Invalid bulk operation.");
  }

  await logAdminAction(admin.id, `Bulk ${operation} on ${productIds.length} products`);
  revalidateAdmin();
  revalidateCatalogue();
}

export async function duplicateProductById(productId: string) {
  const admin = await requirePermission("PRODUCTS", "CREATE");
  const source = await prisma.product.findUniqueOrThrow({ where: { id: productId }, include: { media: true } });
  const product = await prisma.product.create({
    data: {
      name: `${source.name} Copy`,
      slug: await uniqueSlug("product", `${source.name} copy`),
      description: source.description,
      sku: source.sku,
      modelNumber: source.modelNumber,
      manufacturerProductUrl: source.manufacturerProductUrl,
      datasheetUrl: source.datasheetUrl,
      warranty: source.warranty,
      barcode: source.barcode,
      manufacturer: source.manufacturer,
      brand: source.brand,
      price: source.price,
      discountPrice: source.discountPrice,
      stock: source.stock,
      lowStockThreshold: source.lowStockThreshold,
      status: "DRAFT",
      badges: source.badges,
      imageUrl: source.imageUrl,
      imageFolder: source.imageFolder,
      homepagePlacement: source.homepagePlacement,
      specifications: source.specifications === null ? undefined : (source.specifications as InputJsonValue),
      categoryId: source.categoryId,
    },
  });
  await logAdminAction(admin.id, `Duplicated product: ${source.name}`);
  revalidateAdmin();
  revalidateCatalogue(product.slug);
}

export async function archiveProductById(productId: string) {
  const admin = await requirePermission("PRODUCTS", "BULK");
  const product = await prisma.product.update({ where: { id: productId }, data: { archivedAt: new Date(), status: "ARCHIVED", version: { increment: 1 } } as never });
  await logAdminAction(admin.id, `Archived product: ${product.name}`);
  revalidateAdmin();
  revalidateCatalogue(product.slug);
}

export async function deleteProductById(productId: string) {
  const admin = await requirePermission("PRODUCTS", "DELETE");
  await permanentlyDeleteProducts([productId]);
  await logAdminAction(admin.id, `Deleted product: ${productId}`);
  revalidateAdmin();
  revalidateCatalogue();
}

export async function updateProductPrice(formData: FormData) {
  const admin = await requirePermission("PRODUCTS", "EDIT");
  const productId = requiredString(formData, "productId");
  const price = requiredNumber(formData, "price");
  const discountPrice = optionalDecimalNumber(formData, "discountPrice");
  assertDiscountIsValid(price, discountPrice);
  const product = await prisma.product.update({
    where: { id: productId },
    data: { price: price.toFixed(2), discountPrice: discountPrice === null ? null : discountPrice.toFixed(2) },
  });
  await logAdminAction(admin.id, `Updated price for ${product.name}`);
  revalidateAdmin();
  revalidateCatalogue(product.slug);
}

export async function uploadMedia(formData: FormData) {
  const admin = await requirePermission("MEDIA", "MANAGE");
  const bucket = bucketFromForm(formData);
  const folder = folderFromForm(formData, bucket);
  const productId = optionalString(formData, "productId");
  const files = formData.getAll("files");
  let uploadedCount = 0;

  for (const file of files) {
    if (file instanceof File && file.size > 0) {
      const media = await uploadMediaFile({ file, bucket, folder, productId });
      if (media) {
        uploadedCount += 1;
        if (productId && media.type === "IMAGE") {
          await prisma.product.update({
            where: { id: productId },
            data: { imageUrl: media.url },
          });
        }
      }
    }
  }

  await logAdminAction(admin.id, `Uploaded ${uploadedCount} media file${uploadedCount === 1 ? "" : "s"}`);
  revalidateAdmin();
  if (productId) {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
    revalidateCatalogue(product?.slug);
  }
}

export async function assignMediaToProduct(formData: FormData) {
  const admin = await requirePermission("MEDIA", "MANAGE");
  const mediaId = requiredString(formData, "mediaId");
  const productId = optionalString(formData, "productId");
  const media = await prisma.media.update({
    where: { id: mediaId },
    data: { productId },
  });

  if (productId && media.type === "IMAGE") {
    await prisma.product.update({
      where: { id: productId },
      data: { imageUrl: media.url },
    });
  }

  await logAdminAction(admin.id, productId ? `Assigned media to product: ${media.fileName}` : `Unassigned media: ${media.fileName}`);
  revalidateAdmin();
  if (productId) {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
    revalidateCatalogue(product?.slug);
  }
}

export async function deleteMedia(formData: FormData) {
  const admin = await requirePermission("MEDIA", "MANAGE");
  const media = await deleteMediaObject(requiredString(formData, "mediaId"));
  await logAdminAction(admin.id, `Deleted media: ${media.fileName}`);
  revalidateAdmin();
  revalidateCatalogue();
}

export async function updateOrderStatus(formData: FormData) {
  const admin = await requirePermission("ORDERS", "UPDATE_STATUS");
  const orderId = requiredString(formData, "orderId");
  const status = orderStatusFromForm(formData);
  const note = optionalString(formData, "note");
  const previous = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { orderNumber: true, orderStatus: true },
  });

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: status, version: { increment: 1 } } as never,
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        previousStatus: previous.orderStatus,
        newStatus: status,
        note,
        changedBy: admin.id,
      },
    }),
  ]);

  await logAdminAction(admin.id, `Updated order status for ${previous.orderNumber} to ${status}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/order-confirmation/${orderId}`);
}

export async function updateOrderDetails(formData: FormData) {
  const admin = await requirePermission("ORDERS", "EDIT");
  const orderId = requiredString(formData, "orderId");
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      customerName: requiredString(formData, "customerName"),
      customerEmail: requiredString(formData, "customerEmail"),
      customerPhone: requiredString(formData, "customerPhone"),
      deliveryAddress: requiredString(formData, "deliveryAddress"),
      city: requiredString(formData, "city"),
      country: requiredString(formData, "country"),
      deliveryStatus: deliveryStatusFromForm(formData),
      deliveryProvider: optionalString(formData, "deliveryProvider"),
      internalNotes: optionalString(formData, "internalNotes"),
      version: { increment: 1 },
    } as never,
    select: { orderNumber: true },
  });

  await logAdminAction(admin.id, `Updated order details for ${order.orderNumber}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/order-confirmation/${orderId}`);
}

export async function addOrderIssue(formData: FormData) {
  const admin = await requirePermission("ORDERS", "EDIT");
  const orderId = requiredString(formData, "orderId");
  const issue = await prisma.orderIssue.create({
    data: {
      orderId,
      title: requiredString(formData, "title"),
      status: optionalString(formData, "status") ?? "OPEN",
      note: requiredString(formData, "note"),
      createdBy: admin.id,
    },
    include: { order: { select: { orderNumber: true } } },
  });

  await logAdminAction(admin.id, `Added order issue for ${issue.order.orderNumber}: ${issue.title}`);
  revalidatePath("/admin/orders");
}
