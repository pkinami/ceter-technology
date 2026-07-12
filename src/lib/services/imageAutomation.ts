import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

type ImageAutomationResult =
  | {
      ok: true;
      productId: string;
      rawImageUrl: string;
      hostedImageUrl: string;
    }
  | {
      ok: false;
      productId: string;
      error: string;
    };

type BulkImageAutomationOptions = {
  limit?: number;
  onProgress?: (progress: {
    totalItems: number;
    completedItems: number;
    imagesCollected: number;
    errors: number;
    productId?: string;
    message: string;
  }) => Promise<void> | void;
};

type SerpApiImageResult = {
  original?: string;
  link?: string;
  source?: string;
  thumbnail?: string;
  title?: string;
  original_width?: number;
  original_height?: number;
};

type SerpApiImageResponse = {
  images_results?: SerpApiImageResult[];
  error?: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  url?: string;
  public_id?: string;
  error?: {
    message?: string;
  };
};

const brokenImagePatterns = [
  "placeholder",
  "no-image",
  "noimage",
  "missing-image",
  "default-product",
  "/images/ceter-hero.png",
];

function requiredEnv(key: string) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is not configured.`);
  }

  return value;
}

function productImageQuery(product: { brand: string; name: string }) {
  return [product.brand, product.name, "official product-shot white background"]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

function isLikelyImageUrl(value: string) {
  try {
    const url = new URL(value);

    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function imageScore(result: SerpApiImageResult) {
  const url = result.original ?? result.link ?? "";
  const width = result.original_width ?? 0;
  const height = result.original_height ?? 0;
  const area = width * height;
  const urlBonus = /\.(png|jpe?g|webp)(\?|$)/i.test(url) ? 20 : 0;
  const titleBonus = `${result.title ?? ""} ${result.source ?? ""}`.toLowerCase().includes("official") ? 15 : 0;

  return area + urlBonus + titleBonus;
}

function pickBestImageUrl(results: SerpApiImageResult[] = []) {
  return results
    .filter((result) => isLikelyImageUrl(result.original ?? result.link ?? ""))
    .sort((a, b) => imageScore(b) - imageScore(a))
    .map((result) => result.original ?? result.link)
    .find((url): url is string => Boolean(url));
}

async function searchProductImage(product: { brand: string; name: string }) {
  const apiKey = requiredEnv("SERPAPI_KEY");
  const url = new URL("https://serpapi.com/search.json");

  url.searchParams.set("engine", "google_images");
  url.searchParams.set("q", productImageQuery(product));
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("ijn", "0");
  url.searchParams.set("safe", "active");

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "CETER Technology product image automation",
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`SerpApi returned ${response.status}.`);
  }

  const payload = (await response.json()) as SerpApiImageResponse;

  if (payload.error) {
    throw new Error(payload.error);
  }

  const imageUrl = pickBestImageUrl(payload.images_results);

  if (!imageUrl) {
    throw new Error("SerpApi returned no usable image results.");
  }

  return imageUrl;
}

function cloudinarySignature(params: Record<string, string>, apiSecret: string) {
  const signatureBase = Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${signatureBase}${apiSecret}`).digest("hex");
}

async function uploadRemoteImageToCloudinary(rawImageUrl: string, product: { id: string; brand: string; name: string }) {
  const cloudName = requiredEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = requiredEnv("CLOUDINARY_API_KEY");
  const apiSecret = requiredEnv("CLOUDINARY_API_SECRET");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const publicId = `products/${product.id}`;
  const signedParams = {
    background_removal: "cloudinary_ai",
    crop: "pad",
    fetch_format: "auto",
    folder: "ceter-products",
    height: "800",
    public_id: publicId,
    quality: "auto",
    timestamp,
    width: "800",
  };
  const body = new FormData();

  body.set("file", rawImageUrl);
  body.set("api_key", apiKey);
  for (const [key, value] of Object.entries(signedParams)) {
    body.set(key, value);
  }
  body.set("signature", cloudinarySignature(signedParams, apiSecret));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
    signal: AbortSignal.timeout(60000),
  });
  const payload = (await response.json()) as CloudinaryUploadResponse;

  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? `Cloudinary returned ${response.status}.`);
  }

  const hostedUrl = payload.secure_url ?? payload.url;

  if (!hostedUrl) {
    throw new Error("Cloudinary upload did not return a hosted URL.");
  }

  return hostedUrl;
}

export function isMissingOrPlaceholderImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl?.trim()) {
    return true;
  }

  const normalized = imageUrl.toLowerCase();

  return brokenImagePatterns.some((pattern) => normalized.includes(pattern));
}

export async function harvestAndCleanProductImage(productId: string): Promise<ImageAutomationResult> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, brand: true },
    });

    if (!product) {
      throw new Error("Product not found.");
    }

    const rawImageUrl = await searchProductImage(product);
    const hostedImageUrl = await uploadRemoteImageToCloudinary(rawImageUrl, product);

    await prisma.$transaction([
      prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: hostedImageUrl },
      }),
      prisma.media.create({
        data: {
          productId: product.id,
          url: hostedImageUrl,
          fileName: `${product.brand ? `${product.brand} ` : ""}${product.name}`,
          fileType: "image/cloudinary",
          fileSize: 0,
          storagePath: hostedImageUrl,
          type: "IMAGE",
        },
      }),
      prisma.imageSource.create({
        data: {
          productId: product.id,
          url: rawImageUrl,
          storageUrl: hostedImageUrl,
          source: "APPROVED_RETAILER",
          isVerified: true,
        },
      }),
      prisma.productQualityCheck.create({
        data: {
          productId: product.id,
          status: "PASSED",
          hasName: true,
          hasBrand: Boolean(product.brand),
          hasImage: true,
          issues: [],
        },
      }),
    ]);

    return { ok: true, productId: product.id, rawImageUrl, hostedImageUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown image automation error";

    console.error("Product image automation failed", { productId, error: message });

    return { ok: false, productId, error: message };
  }
}

export async function runBulkImageAutomation(options: BulkImageAutomationOptions = {}) {
  const limit = options.limit ?? 500;
  const candidates = await prisma.product.findMany({
    where: {
      OR: [
        { imageUrl: null },
        { imageUrl: "" },
        { imageUrl: { contains: "placeholder", mode: "insensitive" } },
        { imageUrl: { contains: "no-image", mode: "insensitive" } },
        { imageUrl: { contains: "noimage", mode: "insensitive" } },
        { imageUrl: { contains: "missing-image", mode: "insensitive" } },
        { imageUrl: { contains: "default-product", mode: "insensitive" } },
        { imageUrl: { contains: "/images/ceter-hero.png", mode: "insensitive" } },
      ],
    },
    select: { id: true, imageUrl: true, name: true },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });
  const products = candidates.filter((product) => isMissingOrPlaceholderImageUrl(product.imageUrl));
  const totalItems = products.length;
  const results: ImageAutomationResult[] = [];
  let imagesCollected = 0;
  let errors = 0;

  for (const [index, product] of products.entries()) {
    await options.onProgress?.({
      totalItems,
      completedItems: index,
      imagesCollected,
      errors,
      productId: product.id,
      message: `Harvesting image for ${product.name}`,
    });

    const result = await harvestAndCleanProductImage(product.id);
    results.push(result);

    if (result.ok) {
      imagesCollected += 1;
    } else {
      errors += 1;
    }

    await options.onProgress?.({
      totalItems,
      completedItems: index + 1,
      imagesCollected,
      errors,
      productId: product.id,
      message: result.ok ? `Image collected for ${product.name}` : `Image collection failed for ${product.name}: ${result.error}`,
    });
  }

  return {
    totalItems,
    completedItems: totalItems,
    imagesCollected,
    errors,
    results,
  };
}

export type { ImageAutomationResult };
