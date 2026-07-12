import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Bot, ImageUp, PackagePlus, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { DeleteButton } from "../delete-button";
import { bulkUpdateProducts, createProduct, deleteProduct, updateProduct } from "../actions";
import { money, specificationsToText } from "../utils";

export const metadata: Metadata = {
  title: "Admin Products",
  description: "Manage CETER Technology product catalogue.",
};

const productStatuses = [
  { value: "ACTIVE", label: "Active" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
  { value: "NEEDS_ATTENTION", label: "Needs attention" },
  { value: "DRAFT", label: "Draft" },
];

const productBadges = [
  { value: "FEATURED", label: "Featured" },
  { value: "NEW_ARRIVAL", label: "New arrival" },
  { value: "BEST_SELLER", label: "Best seller" },
  { value: "PROMOTION", label: "Promotion" },
];

const pageSize = 24;

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

function paginationHref(page: number) {
  return `/admin/products?page=${page}`;
}

export default async function AdminProductsPage({ searchParams }: Props) {
  await requirePermission("PRODUCTS", "VIEW");

  const requestedPage = Number((await searchParams).page ?? "1");
  const requestedValidPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [categories, totalProducts] = await Promise.all([
    prisma.category.findMany({
      include: { parent: true },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
    }),
    prisma.product.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const currentPage = Math.min(requestedValidPage, totalPages);
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { updatedAt: "desc" },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950">Products</h1>
          <p className="mt-1 text-sm text-slate-500">Manual product management remains available for curated catalogue edits.</p>
        </div>
        <Link
          href="/admin/products/import-automation"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
        >
          <Bot className="h-4 w-4" />
          Product automation
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <PackagePlus className="h-6 w-6 text-orange-500" />
            <div>
              <h2 className="text-xl font-black text-slate-950">Create product</h2>
              <p className="mt-1 text-sm text-slate-500">
                Add printers, accessories, office equipment, or IT solutions.
              </p>
            </div>
          </div>

          <form action={createProduct} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Product name
              <input name="name" required className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Slug
              <input name="slug" placeholder="auto-generated if blank" className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Description
              <textarea name="description" required rows={4} className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Category
                <select name="categoryId" required className="rounded-md border border-slate-300 px-3 py-2">
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.parent ? `${category.parent.name} / ` : ""}
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Brand
                <input name="brand" className="rounded-md border border-slate-300 px-3 py-2" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Price
                <input name="price" required type="number" min="0" step="0.01" className="rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Discount price
                <input name="discountPrice" type="number" min="0" step="0.01" className="rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Stock quantity
                <input name="stock" required type="number" min="0" step="1" className="rounded-md border border-slate-300 px-3 py-2" />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Low stock threshold
              <input name="lowStockThreshold" required type="number" min="0" step="1" defaultValue={5} className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <fieldset className="grid gap-2 text-sm font-semibold text-slate-700">
              <legend>Homepage and campaign labels</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {productBadges.map((badge) => (
                  <label key={badge.value} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                    <input type="checkbox" name="badges" value={badge.value} className="accent-orange-500" />
                    {badge.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Product status
              <select name="status" defaultValue="DRAFT" className="rounded-md border border-slate-300 px-3 py-2">
                {productStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Product image URL
              <input name="imageUrl" type="url" placeholder="https://..." className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Product image folder
              <select name="imageFolder" defaultValue="printers" className="rounded-md border border-slate-300 px-3 py-2">
                <option value="printers">product-images / printers</option>
                <option value="accessories">product-images / accessories</option>
                <option value="office-equipment">product-images / office-equipment</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Upload product image
              <input name="image" type="file" accept="image/*" className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Additional product images
              <input name="galleryImages" type="file" accept="image/*" multiple className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Additional image URLs
              <textarea name="galleryImageUrls" rows={3} placeholder="One URL per line" className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Technical specifications
              <textarea name="specifications" rows={5} placeholder="Speed: Up to 40 ppm&#10;Connectivity: USB, Wi-Fi" className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">
              <PackagePlus className="h-4 w-4" />
              Add product
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ImageUp className="h-6 w-6 text-orange-500" />
            <div>
              <h2 className="text-xl font-black text-slate-950">Product list</h2>
              <p className="mt-1 text-sm text-slate-500">
                Image, name, category, price, stock, status, edit, and delete controls. Showing page {currentPage} of {totalPages}.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {totalProducts === 0
                ? "No products in the catalogue."
                : `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalProducts)} of ${totalProducts} products.`}
            </span>
            <div className="flex gap-2">
              <Link
                href={paginationHref(Math.max(1, currentPage - 1))}
                aria-disabled={currentPage <= 1}
                className={`inline-flex min-h-10 items-center justify-center rounded-md border px-3 py-2 font-bold ${
                  currentPage <= 1
                    ? "pointer-events-none border-slate-200 text-slate-400"
                    : "border-slate-300 text-slate-900 hover:bg-white"
                }`}
              >
                Previous
              </Link>
              <Link
                href={paginationHref(Math.min(totalPages, currentPage + 1))}
                aria-disabled={currentPage >= totalPages}
                className={`inline-flex min-h-10 items-center justify-center rounded-md border px-3 py-2 font-bold ${
                  currentPage >= totalPages
                    ? "pointer-events-none border-slate-200 text-slate-400"
                    : "border-slate-300 text-slate-900 hover:bg-white"
                }`}
              >
                Next
              </Link>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <form action={bulkUpdateProducts} className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <h3 className="text-sm font-black uppercase tracking-wide text-orange-700">
                Bulk product actions
              </h3>
              <div className="mt-3 max-h-56 overflow-y-auto rounded-md border border-orange-100 bg-white">
                {products.map((product) => (
                  <label key={product.id} className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-sm last:border-0">
                    <span className="flex items-center gap-2 font-semibold text-slate-700">
                      <input type="checkbox" name="productIds" value={product.id} className="accent-orange-500" />
                      {product.name}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{product.status.replaceAll("_", " ")}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-5">
                <label className="grid gap-1 text-xs font-bold uppercase text-slate-600">
                  Action
                  <select name="operation" className="rounded-md border border-slate-300 px-3 py-2 text-sm normal-case">
                    <option value="status">Change status</option>
                    <option value="price">Update price</option>
                    <option value="stock">Update stock</option>
                    <option value="delete">Delete selected</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase text-slate-600">
                  Price
                  <input name="price" type="number" min="0" step="0.01" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase text-slate-600">
                  Stock
                  <input name="stock" type="number" min="0" step="1" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase text-slate-600">
                  Status
                  <select name="status" className="rounded-md border border-slate-300 px-3 py-2 text-sm normal-case">
                    {productStatuses.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </label>
                <button className="self-end rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                  Apply to selected
                </button>
              </div>
            </form>

            {products.map((product) => (
              <article key={product.id} className="rounded-lg border border-slate-200 p-4">
                <div className="grid gap-4 lg:grid-cols-[92px_minmax(0,1fr)_auto] lg:items-start">
                  <div className="relative h-24 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={`${product.name} product image`}
                        fill
                        sizes="92px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-black text-slate-950">{product.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {product.category.name} {product.brand ? `- ${product.brand}` : ""}
                        </p>
                      </div>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                        {product.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                      <span>
                        Price: <strong className="text-slate-950">{money(product.price)}</strong>
                      </span>
                      <span>
                        Discount: <strong className="text-slate-950">{money(product.discountPrice)}</strong>
                      </span>
                      <span>
                        Stock: <strong className="text-slate-950">{product.stock}</strong>
                      </span>
                      <span>
                        Threshold: <strong className="text-slate-950">{product.lowStockThreshold}</strong>
                      </span>
                    </div>
                  </div>
                  <form action={deleteProduct}>
                    <input type="hidden" name="productId" value={product.id} />
                    <DeleteButton label={product.name} />
                  </form>
                </div>

                <details className="mt-5 rounded-md bg-slate-50 p-4">
                  <summary className="cursor-pointer text-sm font-black text-slate-950">
                    Edit product
                  </summary>
                  <form action={updateProduct} className="mt-4 grid gap-4">
                    <input type="hidden" name="productId" value={product.id} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Name
                        <input name="name" required defaultValue={product.name} className="rounded-md border border-slate-300 px-3 py-2" />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Slug
                        <input name="slug" defaultValue={product.slug} className="rounded-md border border-slate-300 px-3 py-2" />
                      </label>
                    </div>
                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                      Description
                      <textarea name="description" required rows={3} defaultValue={product.description} className="rounded-md border border-slate-300 px-3 py-2" />
                    </label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Category
                        <select name="categoryId" required defaultValue={product.categoryId} className="rounded-md border border-slate-300 px-3 py-2">
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.parent ? `${category.parent.name} / ` : ""}
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Brand
                        <input name="brand" defaultValue={product.brand} className="rounded-md border border-slate-300 px-3 py-2" />
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-4">
                      <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Price
                        <input name="price" required type="number" min="0" step="0.01" defaultValue={product.price.toString()} className="rounded-md border border-slate-300 px-3 py-2" />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Discount price
                        <input name="discountPrice" type="number" min="0" step="0.01" defaultValue={product.discountPrice?.toString() ?? ""} className="rounded-md border border-slate-300 px-3 py-2" />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Stock
                        <input name="stock" required type="number" min="0" step="1" defaultValue={product.stock} className="rounded-md border border-slate-300 px-3 py-2" />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Low stock threshold
                        <input name="lowStockThreshold" required type="number" min="0" step="1" defaultValue={product.lowStockThreshold} className="rounded-md border border-slate-300 px-3 py-2" />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Status
                        <select name="status" defaultValue={product.status} className="rounded-md border border-slate-300 px-3 py-2">
                          {productStatuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <fieldset className="grid gap-2 text-sm font-semibold text-slate-700">
                      <legend>Homepage and campaign labels</legend>
                      <div className="grid gap-2 sm:grid-cols-4">
                        {productBadges.map((badge) => (
                          <label key={badge.value} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                            <input
                              type="checkbox"
                              name="badges"
                              value={badge.value}
                              defaultChecked={product.badges.includes(badge.value as never)}
                              className="accent-orange-500"
                            />
                            {badge.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Image URL
                        <input name="imageUrl" type="url" defaultValue={product.imageUrl ?? ""} className="rounded-md border border-slate-300 px-3 py-2" />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Upload replacement image
                        <input name="image" type="file" accept="image/*" className="rounded-md border border-slate-300 px-3 py-2" />
                      </label>
                    </div>
                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                      Product image folder
                      <select name="imageFolder" defaultValue="printers" className="rounded-md border border-slate-300 px-3 py-2">
                        <option value="printers">product-images / printers</option>
                        <option value="accessories">product-images / accessories</option>
                        <option value="office-equipment">product-images / office-equipment</option>
                      </select>
                    </label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Add gallery uploads
                        <input name="galleryImages" type="file" accept="image/*" multiple className="rounded-md border border-slate-300 px-3 py-2" />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Add gallery URLs
                        <textarea name="galleryImageUrls" rows={3} placeholder="One URL per line" className="rounded-md border border-slate-300 px-3 py-2" />
                      </label>
                    </div>
                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                      Technical specifications
                      <textarea name="specifications" rows={5} defaultValue={specificationsToText(product.specifications)} className="rounded-md border border-slate-300 px-3 py-2" />
                    </label>
                    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                      <Save className="h-4 w-4" />
                      Save product
                    </button>
                  </form>
                </details>
              </article>
            ))}
            {products.length === 0 ? (
              <p className="rounded-md bg-slate-50 p-6 text-sm text-slate-500">
                No products yet.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
