import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export const MEDIA_BUCKETS = {
  productImages: "product-images",
  websiteMedia: "website-media",
  productVideos: "product-videos",
} as const;

export const MEDIA_FOLDERS = {
  [MEDIA_BUCKETS.productImages]: ["printers", "accessories", "office-equipment"],
  [MEDIA_BUCKETS.websiteMedia]: ["banners", "brands", "promotions"],
  [MEDIA_BUCKETS.productVideos]: ["products"],
} as const;

export type MediaBucket = (typeof MEDIA_BUCKETS)[keyof typeof MEDIA_BUCKETS];

const allowedMimePrefixes = ["image/", "video/"];

export function formatBytes(bytes: number) {
  if (!bytes) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function inferMediaType(fileType: string) {
  return fileType.startsWith("video/") ? ("VIDEO" as const) : ("IMAGE" as const);
}

export function storagePathFromPublicUrl(url: string) {
  const marker = "/storage/v1/object/public/";
  const index = url.indexOf(marker);

  if (index === -1) {
    return "";
  }

  const path = url.slice(index + marker.length);
  const [, ...segments] = path.split("/");

  return decodeURIComponent(segments.join("/"));
}

export function fileNameFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const fileName = pathname.split("/").filter(Boolean).pop();

    return fileName ? decodeURIComponent(fileName) : "External media";
  } catch {
    return "External media";
  }
}

function assertBucket(value: FormDataEntryValue | null): MediaBucket {
  if (
    value === MEDIA_BUCKETS.productImages ||
    value === MEDIA_BUCKETS.websiteMedia ||
    value === MEDIA_BUCKETS.productVideos
  ) {
    return value;
  }

  throw new Error("Invalid media bucket.");
}

export function bucketFromForm(formData: FormData, key = "bucket") {
  return assertBucket(formData.get(key));
}

export function folderFromForm(formData: FormData, bucket: MediaBucket, key = "folder") {
  const value = formData.get(key);
  const folder = typeof value === "string" ? value : "";
  const validFolders = MEDIA_FOLDERS[bucket] as readonly string[];

  if (!validFolders.includes(folder)) {
    throw new Error("Invalid media folder.");
  }

  return folder;
}

function safeStorageName(fileName: string) {
  const extension = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() : "";
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "media"}${extension ? `.${extension}` : ""}`;
}

export async function uploadMediaFile({
  file,
  bucket,
  folder,
  productId,
}: {
  file: File;
  bucket: MediaBucket;
  folder: string;
  productId?: string | null;
}) {
  if (file.size === 0) {
    return null;
  }

  if (!allowedMimePrefixes.some((prefix) => file.type.startsWith(prefix))) {
    throw new Error("Only image and video uploads are allowed.");
  }

  if (bucket !== MEDIA_BUCKETS.productVideos && !file.type.startsWith("image/")) {
    throw new Error("Only product-videos accepts video uploads.");
  }

  const supabase = await createClient();
  const storagePath = `${folder}/${crypto.randomUUID()}-${safeStorageName(file.name)}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, await file.arrayBuffer(), {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  return prisma.media.create({
    data: {
      productId: productId || null,
      url: publicUrl,
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
      storagePath,
      type: inferMediaType(file.type),
    },
  });
}

export async function deleteMediaObject(mediaId: string) {
  const media = await prisma.media.findUnique({ where: { id: mediaId } });

  if (!media) {
    throw new Error("Media item not found.");
  }

  if (media.storagePath) {
    const bucket = media.url.includes(`/${MEDIA_BUCKETS.websiteMedia}/`)
      ? MEDIA_BUCKETS.websiteMedia
      : media.url.includes(`/${MEDIA_BUCKETS.productVideos}/`)
        ? MEDIA_BUCKETS.productVideos
        : MEDIA_BUCKETS.productImages;
    const supabase = await createClient();
    const { error } = await supabase.storage.from(bucket).remove([media.storagePath]);

    if (error) {
      throw new Error(error.message);
    }
  }

  await prisma.product.updateMany({
    where: { imageUrl: media.url },
    data: { imageUrl: null },
  });
  await prisma.media.delete({ where: { id: media.id } });

  return media;
}
