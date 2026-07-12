import { MEDIA_BUCKETS, uploadMediaFile } from "@/lib/media";
import type { EnrichedProduct } from "./types";

function folderForProduct(product: EnrichedProduct) {
  const category = product.categoryPath.join(" ").toLowerCase();

  if (category.includes("printer")) {
    return "printers";
  }

  if (category.includes("accessories") || category.includes("storage") || category.includes("memory")) {
    return "accessories";
  }

  return "office-equipment";
}

function extensionFromType(type: string) {
  if (type.includes("png")) {
    return "png";
  }

  if (type.includes("webp")) {
    return "webp";
  }

  return "jpg";
}

export async function collectProductImage(product: EnrichedProduct) {
  for (const url of product.imageUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "image/avif,image/webp,image/png,image/jpeg,image/*",
          "user-agent": "CETER Technology image collection (+https://cetertechnology.com)",
        },
        signal: AbortSignal.timeout(15000),
      });
      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok || !contentType.startsWith("image/")) {
        continue;
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        continue;
      }

      const file = new File([blob], `${product.fingerprint || crypto.randomUUID()}.${extensionFromType(contentType)}`, {
        type: contentType,
      });

      const media = await uploadMediaFile({
        file,
        bucket: MEDIA_BUCKETS.productImages,
        folder: folderForProduct(product),
      });

      if (media) {
        return {
          originalUrl: url,
          storageUrl: media.url,
          storagePath: media.storagePath,
        };
      }
    } catch {
      // Try the next source image.
    }
  }

  return null;
}
