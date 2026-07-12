import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FileImage, Film, Search, Trash2, UploadCloud } from "lucide-react";
import { assignMediaToProduct, deleteMedia, uploadMedia } from "@/app/admin/actions";
import { DeleteButton } from "@/app/admin/delete-button";
import { formatDate } from "@/app/admin/utils";
import { formatBytes, MEDIA_BUCKETS } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import {
  CopyUrlButton,
  DestinationFields,
  SaveAssignmentButton,
  UploadSubmitButton,
} from "./media-controls";

export const metadata: Metadata = {
  title: "Admin Media",
  description: "Upload, manage, and assign CETER Technology media assets.",
};

type Props = {
  searchParams: Promise<{
    q?: string;
    type?: string;
  }>;
};

function bucketLabel(url: string) {
  if (url.includes(`/${MEDIA_BUCKETS.websiteMedia}/`)) {
    return "Website media";
  }

  if (url.includes(`/${MEDIA_BUCKETS.productVideos}/`)) {
    return "Product videos";
  }

  return "Product images";
}

export default async function AdminMediaPage({ searchParams }: Props) {
  const { q = "", type = "all" } = await searchParams;
  const query = q.trim();
  const fileTypeFilter =
    type === "images" ? { startsWith: "image/" } : type === "videos" ? { startsWith: "video/" } : undefined;
  const [media, products] = await Promise.all([
    prisma.media.findMany({
      where: {
        ...(fileTypeFilter ? { fileType: fileTypeFilter } : {}),
        ...(query
          ? {
              OR: [
                { fileName: { contains: query, mode: "insensitive" } },
                { fileType: { contains: query, mode: "insensitive" } },
                { url: { contains: query, mode: "insensitive" } },
                { product: { name: { contains: query, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <UploadCloud className="h-6 w-6 text-orange-500" />
              <div>
                <h2 className="text-xl font-black text-slate-950">Upload media</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Files are stored in Supabase Storage; metadata is saved in PostgreSQL.
                </p>
              </div>
            </div>

            <form action={uploadMedia} className="mt-6 grid gap-4">
              <label className="grid min-h-40 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:border-orange-300 hover:bg-orange-50">
                <span>
                  <UploadCloud className="mx-auto h-8 w-8 text-slate-500" />
                  <span className="mt-3 block text-sm font-bold text-slate-900">
                    Drop files here or choose files
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Images for products and website content; videos for future product media.
                  </span>
                </span>
                <input name="files" type="file" accept="image/*,video/*" multiple required className="sr-only" />
              </label>

              <DestinationFields />
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Assign to product
                <select name="productId" defaultValue="" className="rounded-md border border-slate-300 px-3 py-2">
                  <option value="">Unassigned media library item</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <UploadSubmitButton />
            </form>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Storage buckets</h2>
            <ul className="mt-4 grid gap-3 text-sm text-slate-600">
              <li>
                <strong className="text-slate-900">product-images:</strong> printers, accessories, office-equipment
              </li>
              <li>
                <strong className="text-slate-900">website-media:</strong> banners, brands, promotions
              </li>
              <li>
                <strong className="text-slate-900">product-videos:</strong> products
              </li>
            </ul>
          </div>
        </aside>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">Media library</h2>
              <p className="mt-1 text-sm text-slate-500">
                {media.length} file{media.length === 1 ? "" : "s"} available for products and site content.
              </p>
            </div>
            <form className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px_auto]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search media"
                  className="min-h-10 w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm"
                />
              </label>
              <select name="type" defaultValue={type} className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="all">All types</option>
                <option value="images">Images</option>
                <option value="videos">Videos</option>
              </select>
              <button className="inline-flex min-h-10 items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                Filter
              </button>
            </form>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {media.map((item) => {
              const isImage = item.fileType.startsWith("image/");
              const isVideo = item.fileType.startsWith("video/");
              const Icon = isVideo ? Film : FileImage;

              return (
                <article key={item.id} className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="relative aspect-[4/3] bg-slate-100">
                    {isImage ? (
                      <Image
                        src={item.url}
                        alt={item.fileName || "Media item"}
                        fill
                        sizes="(min-width: 1536px) 300px, (min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-slate-500">
                        <Icon className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <div className="grid gap-4 p-4">
                    <div>
                      <h3 className="break-words text-sm font-black text-slate-950">
                        {item.fileName || "Untitled media"}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">{bucketLabel(item.url)}</p>
                    </div>
                    <dl className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                      <div>
                        <dt className="font-bold text-slate-900">Type</dt>
                        <dd className="mt-1">{item.fileType}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-slate-900">Size</dt>
                        <dd className="mt-1">{formatBytes(item.fileSize)}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-slate-900">Uploaded</dt>
                        <dd className="mt-1">{formatDate(item.createdAt)}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-slate-900">Product</dt>
                        <dd className="mt-1">{item.product?.name ?? "Unassigned"}</dd>
                      </div>
                    </dl>
                    <form action={assignMediaToProduct} className="grid gap-2">
                      <input type="hidden" name="mediaId" value={item.id} />
                      <select name="productId" defaultValue={item.productId ?? ""} className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm">
                        <option value="">Unassigned</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <SaveAssignmentButton />
                    </form>
                    <div className="flex flex-wrap gap-2">
                      <CopyUrlButton url={item.url} />
                      <Link
                        href={item.url}
                        target="_blank"
                        className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100"
                      >
                        Open
                      </Link>
                      <form action={deleteMedia} className="ml-auto">
                        <input type="hidden" name="mediaId" value={item.id} />
                        <DeleteButton label={item.fileName || item.url} />
                      </form>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {media.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-8 text-center">
              <Trash2 className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-600">
                No media matches the current filters.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
