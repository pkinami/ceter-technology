import type { Metadata } from "next";
import type { InputHTMLAttributes, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Archive, Copy, Download, FileUp, PackagePlus, Save, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { DeleteButton } from "../delete-button";
import { archiveProduct, bulkUpdateProducts, createProduct, deleteProduct, duplicateProduct, updateProduct } from "../actions";
import { money, specificationsToText } from "../utils";
import { ProductBulkControls } from "./product-bulk-controls";

export const metadata: Metadata = {
  title: "Product Manager",
  description: "ERP-style catalogue management for CETER Technology.",
};

const productStatuses = ["ACTIVE", "OUT_OF_STOCK", "NEEDS_ATTENTION", "DRAFT"] as const;
const productBadges = [
  { value: "FEATURED", label: "Featured" },
  { value: "NEW_ARRIVAL", label: "New arrival" },
  { value: "BEST_SELLER", label: "Best seller" },
  { value: "PROMOTION", label: "Promotion" },
];
const pageSize = 25;

type Props = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    category?: string;
    brand?: string;
  }>;
};

function pageHref(input: { page: number; q?: string; status?: string; category?: string; brand?: string }) {
  const params = new URLSearchParams();
  params.set("page", String(input.page));
  if (input.q) params.set("q", input.q);
  if (input.status) params.set("status", input.status);
  if (input.category) params.set("category", input.category);
  if (input.brand) params.set("brand", input.brand);
  return `/admin/products?${params.toString()}`;
}

function margin(cost: unknown, price: unknown) {
  const costValue = Number(String(cost ?? 0));
  const priceValue = Number(String(price ?? 0));
  if (!costValue || !priceValue) return "-";
  return `${(((priceValue - costValue) / priceValue) * 100).toFixed(1)}%`;
}

export default async function AdminProductsPage({ searchParams }: Props) {
  await requirePermission("PRODUCTS", "VIEW");
  const params = await searchParams;
  const requestedPage = Number(params.page ?? "1");
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const q = params.q?.trim() ?? "";
  const status = productStatuses.includes(params.status as never) ? params.status : "";
  const categoryId = params.category ?? "";
  const brand = params.brand ?? "";
  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
            { brand: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(status ? { status: status as (typeof productStatuses)[number] } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(brand ? { brand } : {}),
  };

  const [categories, suppliers, brandRows, totalProducts, products] = await Promise.all([
    prisma.category.findMany({ include: { parent: true }, orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }] }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ distinct: ["brand"], select: { brand: true }, where: { brand: { not: "" } }, orderBy: { brand: "asc" } }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { category: true, supplier: true, campaigns: { include: { campaign: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-orange-600">Catalogue operations</p>
          <h1 className="text-2xl font-black text-slate-950">Product manager</h1>
          <p className="mt-1 text-sm text-slate-500">Server-side search, filtering, pagination, bulk actions, media, pricing, inventory, and merchandising.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/import" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 hover:bg-white">
            <FileUp className="h-4 w-4" /> Import products
          </Link>
          <Link href="/api/admin/import/template/products" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 hover:bg-white">
            <Download className="h-4 w-4" /> Export template
          </Link>
        </div>
      </div>

      <form className="mb-5 grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_180px_220px_180px_auto]">
        <label className="relative">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input name="q" defaultValue={q} placeholder="Search name, SKU, slug, or brand" className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm" />
        </label>
        <select name="status" defaultValue={status} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">All statuses</option>
          {productStatuses.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
        </select>
        <select name="category" defaultValue={categoryId} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.parent ? `${category.parent.name} / ` : ""}{category.name}</option>
          ))}
        </select>
        <select name="brand" defaultValue={brand} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">All brands</option>
          {brandRows.map((item) => <option key={item.brand} value={item.brand}>{item.brand}</option>)}
        </select>
        <button className="min-h-10 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">Filter</button>
      </form>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-5">
          <form action={bulkUpdateProducts} className="rounded-md border border-orange-200 bg-orange-50 p-4">
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="filterStatus" value={status} />
            <input type="hidden" name="categoryId" value={categoryId} />
            <input type="hidden" name="brand" value={brand} />
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <label className="grid gap-1 text-xs font-bold uppercase text-slate-600">
                Bulk action
                <select name="operation" className="h-10 rounded-md border border-slate-300 px-3 text-sm normal-case">
                  <option value="status">Change status</option>
                  <option value="price">Update selling price</option>
                  <option value="stock">Set stock</option>
                  <option value="delete">Bulk delete</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-bold uppercase text-slate-600">
                Price
                <input name="price" type="number" min="0" step="0.01" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
              </label>
              <label className="grid gap-1 text-xs font-bold uppercase text-slate-600">
                Stock
                <input name="stock" type="number" min="0" step="1" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
              </label>
              <label className="grid gap-1 text-xs font-bold uppercase text-slate-600">
                Status
                <select name="status" className="h-10 rounded-md border border-slate-300 px-3 text-sm normal-case">
                  {productStatuses.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
                </select>
              </label>
              <button className="min-h-10 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">Apply to selected</button>
            </div>
            <ProductBulkControls shownCount={products.length} totalCount={totalProducts} />

            <div className="mt-4 overflow-x-auto rounded-md border border-orange-100 bg-white">
              <table className="w-full min-w-[1180px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="w-10 px-3 py-3">Bulk</th>
                    <th className="px-3 py-3">Image</th>
                    <th className="px-3 py-3">Product name</th>
                    <th className="px-3 py-3">SKU</th>
                    <th className="px-3 py-3">Brand</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Selling price</th>
                    <th className="px-3 py-3">Discount</th>
                    <th className="px-3 py-3">Stock</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Featured</th>
                    <th className="px-3 py-3">Promotion</th>
                    <th className="px-3 py-3">Last updated</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => {
                    const promotionActive = product.badges.includes("PROMOTION") || product.campaigns.some((item) => item.campaign.status === "ACTIVE");
                    return (
                      <tr key={product.id} className="align-top">
                        <td className="px-3 py-3"><input type="checkbox" name="productIds" value={product.id} data-product-select="true" className="accent-orange-500" /></td>
                        <td className="px-3 py-3">
                          <div className="relative h-12 w-12 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                            {product.imageUrl ? <Image src={product.imageUrl} alt="" fill sizes="48px" className="object-cover" /> : null}
                          </div>
                        </td>
                        <td className="max-w-[260px] px-3 py-3 font-bold text-slate-950">{product.name}</td>
                        <td className="px-3 py-3 text-slate-600">{product.sku || "-"}</td>
                        <td className="px-3 py-3 text-slate-600">{product.brand || "-"}</td>
                        <td className="px-3 py-3 text-slate-600">{product.category.name}</td>
                        <td className="px-3 py-3 font-bold text-slate-950">{money(product.price)}</td>
                        <td className="px-3 py-3 text-slate-600">{money(product.discountPrice)}</td>
                        <td className={`px-3 py-3 font-bold ${product.stock <= product.lowStockThreshold ? "text-red-700" : "text-slate-950"}`}>{product.stock}</td>
                        <td className="px-3 py-3"><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{product.status.replaceAll("_", " ")}</span></td>
                        <td className="px-3 py-3 text-slate-600">{product.badges.includes("FEATURED") ? "Yes" : "No"}</td>
                        <td className="px-3 py-3 text-slate-600">{promotionActive ? "Yes" : "No"}</td>
                        <td className="px-3 py-3 text-slate-500">{product.updatedAt.toLocaleDateString("en-KE")}</td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            <button formAction={duplicateProduct} name="productId" value={product.id} title="Duplicate" className="grid h-9 w-9 place-items-center rounded-md border border-slate-300 hover:bg-slate-50"><Copy className="h-4 w-4" /></button>
                            <button formAction={archiveProduct} name="productId" value={product.id} title="Archive" className="grid h-9 w-9 place-items-center rounded-md border border-slate-300 hover:bg-slate-50"><Archive className="h-4 w-4" /></button>
                            <DeleteButton formAction={deleteProduct} name="productId" value={product.id} label={product.name} iconOnly className="grid" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {products.length === 0 ? <p className="p-6 text-sm text-slate-500">No products match the current filters.</p> : null}
            </div>
          </form>

          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
            <span>Showing {products.length ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, totalProducts)} of {totalProducts}</span>
            <div className="flex gap-2">
              <Link aria-disabled={currentPage <= 1} className={`rounded-md border px-3 py-2 font-bold ${currentPage <= 1 ? "pointer-events-none text-slate-400" : "hover:bg-slate-50"}`} href={pageHref({ page: Math.max(1, currentPage - 1), q, status, category: categoryId, brand })}>Previous</Link>
              <Link aria-disabled={currentPage >= totalPages} className={`rounded-md border px-3 py-2 font-bold ${currentPage >= totalPages ? "pointer-events-none text-slate-400" : "hover:bg-slate-50"}`} href={pageHref({ page: Math.min(totalPages, currentPage + 1), q, status, category: categoryId, brand })}>Next</Link>
            </div>
          </div>

          <div className="space-y-4">
            {products.map((product) => (
              <details key={product.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <summary className="cursor-pointer text-sm font-black text-slate-950">Edit {product.name}</summary>
                <ProductForm action={updateProduct} categories={categories} suppliers={suppliers} product={product} submitLabel="Save product" />
              </details>
            ))}
          </div>
        </div>

        <aside className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <PackagePlus className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-black text-slate-950">Create product</h2>
          </div>
          <ProductForm action={createProduct} categories={categories} suppliers={suppliers} submitLabel="Create product" />
        </aside>
      </div>
    </section>
  );
}

function ProductForm({
  action,
  categories,
  suppliers,
  product,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  categories: Array<{ id: string; name: string; parent: { name: string } | null }>;
  suppliers: Array<{ id: string; name: string }>;
  product?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    sku: string | null;
    brand: string;
    costPrice: unknown;
    price: unknown;
    discountPrice: unknown;
    taxRate: unknown;
    stock: number;
    lowStockThreshold: number;
    supplierId: string | null;
    warehouseLocation: string | null;
    status: string;
    badges: string[];
    imageUrl: string | null;
    imageFolder: string | null;
    homepagePlacement: string | null;
    specifications: unknown;
    categoryId: string;
  };
  submitLabel: string;
}) {
  return (
    <form action={action} className="mt-5 grid gap-5">
      {product ? <input type="hidden" name="productId" value={product.id} /> : null}
      <EditorSection title="Basic Information">
        <InputField name="name" label="Product name" required defaultValue={product?.name} />
        <InputField name="slug" label="Slug" defaultValue={product?.slug} placeholder="auto-generated if blank" />
        <InputField name="sku" label="SKU" defaultValue={product?.sku ?? ""} />
        <InputField name="brand" label="Brand" defaultValue={product?.brand} />
        <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
          Category
          <select name="categoryId" required defaultValue={product?.categoryId ?? ""} className="h-10 rounded-md border border-slate-300 px-3">
            <option value="">Select category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.parent ? `${category.parent.name} / ` : ""}{category.name}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
          Description
          <textarea name="description" required rows={4} defaultValue={product?.description} className="rounded-md border border-slate-300 px-3 py-2" />
        </label>
      </EditorSection>

      <EditorSection title="Pricing">
        <InputField name="costPrice" label="Cost price" type="number" min="0" step="0.01" defaultValue={String(product?.costPrice ?? "")} />
        <InputField name="price" label="Selling price" required type="number" min="0" step="0.01" defaultValue={String(product?.price ?? "")} />
        <InputField name="discountPrice" label="Discount price" type="number" min="0" step="0.01" defaultValue={String(product?.discountPrice ?? "")} />
        <InputField name="taxRate" label="Tax" type="number" min="0" step="0.01" defaultValue={String(product?.taxRate ?? "16")} />
        <div className="rounded-md bg-slate-50 p-3 text-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Profit margin</p>
          <p className="mt-1 text-xl font-black text-slate-950">{margin(product?.costPrice, product?.price)}</p>
        </div>
      </EditorSection>

      <EditorSection title="Inventory">
        <InputField name="stock" label="Stock quantity" required type="number" min="0" step="1" defaultValue={String(product?.stock ?? 0)} />
        <InputField name="lowStockThreshold" label="Low stock threshold" required type="number" min="0" step="1" defaultValue={String(product?.lowStockThreshold ?? 5)} />
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Supplier
          <select name="supplierId" defaultValue={product?.supplierId ?? ""} className="h-10 rounded-md border border-slate-300 px-3">
            <option value="">No primary supplier</option>
            {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
          </select>
        </label>
        <InputField name="warehouseLocation" label="Warehouse location" defaultValue={product?.warehouseLocation ?? ""} />
      </EditorSection>

      <EditorSection title="Marketing">
        <fieldset className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
          <legend>Flags</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {productBadges.map((badge) => (
              <label key={badge.value} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                <input type="checkbox" name="badges" value={badge.value} defaultChecked={product?.badges.includes(badge.value) ?? false} className="accent-orange-500" />
                {badge.label}
              </label>
            ))}
          </div>
        </fieldset>
        <InputField name="homepagePlacement" label="Homepage placement" defaultValue={product?.homepagePlacement ?? ""} placeholder="Hero, deals row, printer shelf" />
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Status
          <select name="status" defaultValue={product?.status ?? "DRAFT"} className="h-10 rounded-md border border-slate-300 px-3">
            {productStatuses.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
          </select>
        </label>
      </EditorSection>

      <EditorSection title="Media">
        <InputField name="imageUrl" label="Main image" type="url" defaultValue={product?.imageUrl ?? ""} placeholder="https://..." />
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Image folder
          <select name="imageFolder" defaultValue={product?.imageFolder ?? "printers"} className="h-10 rounded-md border border-slate-300 px-3">
            <option value="printers">product-images / printers</option>
            <option value="accessories">product-images / accessories</option>
            <option value="office-equipment">product-images / office-equipment</option>
            <option value="ict">product-images / ict</option>
            <option value="consumables">product-images / consumables</option>
          </select>
        </label>
        <InputField name="image" label="Upload main image" type="file" />
        <InputField name="galleryImages" label="Gallery images" type="file" multiple />
        <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
          Gallery image URLs
          <textarea name="galleryImageUrls" rows={3} placeholder="One URL per line" className="rounded-md border border-slate-300 px-3 py-2" />
        </label>
      </EditorSection>

      <EditorSection title="Technical Specifications">
        <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
          Dynamic attributes
          <textarea
            name="specifications"
            rows={7}
            defaultValue={specificationsToText(product?.specifications)}
            placeholder={"Print technology: Laser\nPages per minute: 40\nColour/Mono: Mono\nConnectivity: USB, Wi-Fi\nPaper size: A4\nDuty cycle: 80000"}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
      </EditorSection>

      <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">
        <Save className="h-4 w-4" /> {submitLabel}
      </button>
    </form>
  );
}

function EditorSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-slate-200 p-4">
      <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

function InputField({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <input {...props} className="h-10 rounded-md border border-slate-300 px-3" />
    </label>
  );
}
