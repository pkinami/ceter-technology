"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

const PRODUCT_IMAGE_BUCKET = "product-images";

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required.`);
  }

  return value.trim();
}

async function uploadProductImage(file: File | null) {
  if (!file || file.size === 0) {
    return null;
  }

  const supabase = await createClient();
  const extension = file.name.split(".").pop() ?? "jpg";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `products/${crypto.randomUUID()}-${safeName}.${extension}`;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);

  return publicUrl;
}

export async function createCategory(formData: FormData) {
  const admin = await requireAdmin();
  const name = requiredString(formData, "name");

  await prisma.category.upsert({
    where: { name },
    update: {},
    create: { name },
  });

  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: `Created category: ${name}`,
    },
  });

  revalidatePath("/admin");
}

export async function createProduct(formData: FormData) {
  const admin = await requireAdmin();
  const imageFile = formData.get("image");
  const uploadedImageUrl = await uploadProductImage(
    imageFile instanceof File ? imageFile : null,
  );
  const imageUrl = uploadedImageUrl ?? requiredString(formData, "imageUrl");

  const product = await prisma.product.create({
    data: {
      name: requiredString(formData, "name"),
      description: requiredString(formData, "description"),
      price: requiredString(formData, "price"),
      stock: Number(requiredString(formData, "stock")),
      imageUrl,
      categoryId: requiredString(formData, "categoryId"),
      media: {
        create: {
          url: imageUrl,
          type: "IMAGE",
        },
      },
    },
  });

  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: `Created product: ${product.name}`,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/products");
}

export async function updateProductManagement(formData: FormData) {
  const admin = await requireAdmin();
  const productId = requiredString(formData, "productId");
  const imageFile = formData.get("image");
  const uploadedImageUrl = await uploadProductImage(
    imageFile instanceof File ? imageFile : null,
  );
  const imageUrlInput = formData.get("imageUrl");
  const imageUrl =
    uploadedImageUrl ??
    (typeof imageUrlInput === "string" && imageUrlInput.trim() !== ""
      ? imageUrlInput.trim()
      : undefined);

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      price: requiredString(formData, "price"),
      stock: Number(requiredString(formData, "stock")),
      ...(imageUrl ? { imageUrl } : {}),
      ...(imageUrl
        ? {
            media: {
              create: {
                url: imageUrl,
                type: "IMAGE",
              },
            },
          }
        : {}),
    },
  });

  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: `Updated product management fields: ${product.name}`,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/products");
}

export async function updateOrderStatus(formData: FormData) {
  const admin = await requireAdmin();
  const orderId = requiredString(formData, "orderId");
  const status = requiredString(formData, "status");

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: status as "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED",
    },
  });

  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: `Updated order ${order.id} status to ${order.status}`,
    },
  });

  revalidatePath("/admin");
}
