import type { Metadata } from "next";
import type { InputHTMLAttributes, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { FileSpreadsheet, Save, Search, X } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { createBrand, createCategory, createProduct, updateProduct } from "../actions";
import { money, specificationsToText } from "../utils";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { ProductManagementTable } from "./product-management-table";
import { productDisplayStatus, productImageUrls, validateProductReadiness } from "@/lib/product-validation";

export const metadata: Metadata = {
  title: "Product Manager",
  description: "ERP-style catalogue management for CETER Technology.",
};

const productStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
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
    pageSize?: string;
    q?: string;
    productName?: string;
    modelNumber?: string;
    supplierSku?: string;
    status?: string;
    publicationStatus?: string;
    validationStatus?: string;
    category?: string;
    brand?: string;
    manufacturer?: string;
    stockState?: string;
    minPrice?: string;
    maxPrice?: string;
    missingRequired?: string;
    missingImage1?: string;
    missingImage2?: string;
    thirdImage?: string;
    warrantyState?: string;
    archived?: string;
    deleted?: string;
    tab?: string;
    sort?: string;
    order?: string;
    edit?: string;
    notice?: string;
  }>;
};

function pageHref(input: {
  page: number;
  q?: string;
  productName?: string;
  modelNumber?: string;
  supplierSku?: string;
  status?: string;
  validationStatus?: string;
  category?: string;
  brand?: string;
  manufacturer?: string;
  stockState?: string;
  minPrice?: string;
  maxPrice?: string;
  missingRequired?: boolean;
  missingImage1?: boolean;
  missingImage2?: boolean;
  thirdImage?: string;
  warrantyState?: string;
  archived?: string;
  deleted?: string;
  tab?: string;
  sort?: string;
  order?: string;
  pageSize?: number;
}) {
  const params = new URLSearchParams();
  params.set("page", String(input.page));
  if (input.pageSize) params.set("pageSize", String(input.pageSize));
  if (input.q) params.set("q", input.q);
  if (input.productName) params.set("productName", input.productName);
  if (input.modelNumber) params.set("modelNumber", input.modelNumber);
  if (input.supplierSku) params.set("supplierSku", input.supplierSku);
  if (input.status) params.set("status", input.status);
  if (input.validationStatus) params.set("validationStatus", input.validationStatus);
  if (input.category) params.set("category", input.category);
  if (input.brand) params.set("brand", input.brand);
  if (input.manufacturer) params.set("manufacturer", input.manufacturer);
  if (input.stockState) params.set("stockState", input.stockState);
  if (input.minPrice) params.set("minPrice", input.minPrice);
  if (input.maxPrice) params.set("maxPrice", input.maxPrice);
  if (input.missingRequired) params.set("missingRequired", "true");
  if (input.missingImage1) params.set("missingImage1", "true");
  if (input.missingImage2) params.set("missingImage2", "true");
  if (input.thirdImage) params.set("thirdImage", input.thirdImage);
  if (input.warrantyState) params.set("warrantyState", input.warrantyState);
  if (input.archived) params.set("archived", input.archived);
  if (input.deleted) params.set("deleted", input.deleted);
  if (input.tab) params.set("tab", input.tab);
  if (input.sort) params.set("sort", input.sort);
  if (input.order) params.set("order", input.order);
  return `/admin/products?${params.toString()}`;
}

function editHref(baseParams: URLSearchParams, productId: string) {
  const params = new URLSearchParams(baseParams);
  params.set("edit", productId);
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
  const requestedPageSize = Number(params.pageSize ?? String(pageSize));
  const currentPageSize = [10, 25, 50, 100].includes(requestedPageSize) ? requestedPageSize : pageSize;
  const q = params.q?.trim() ?? "";
  const productName = params.productName?.trim() ?? "";
  const modelNumber = params.modelNumber?.trim() ?? "";
  const supplierSku = params.supplierSku?.trim() ?? "";
  const statusValue = params.publicationStatus ?? params.status;
  const status = productStatuses.includes(statusValue as never) ? (statusValue as (typeof productStatuses)[number]) : "";
  const validationStatus = ["ready", "errors", "published", "draft"].includes(params.validationStatus ?? "") ? params.validationStatus ?? "" : "";
  const categoryId = params.category ?? "";
  const brand = params.brand ?? "";
  const manufacturer = params.manufacturer?.trim() ?? "";
  const stockState = ["in-stock", "out-of-stock", "low-stock"].includes(params.stockState ?? "") ? params.stockState ?? "" : "";
  const minPrice = params.minPrice?.trim() ?? "";
  const maxPrice = params.maxPrice?.trim() ?? "";
  const missingRequired = params.missingRequired === "true";
  const missingImage1 = params.missingImage1 === "true";
  const missingImage2 = params.missingImage2 === "true";
  const thirdImage = ["present", "absent"].includes(params.thirdImage ?? "") ? params.thirdImage ?? "" : "";
  const warrantyState = ["present", "missing"].includes(params.warrantyState ?? "") ? params.warrantyState ?? "" : "";
  const archived = params.archived === "true" || params.tab === "archived";
  const deleted = params.deleted === "true" || params.tab === "deleted";
  const activeTab = deleted ? "deleted" : archived ? "archived" : params.tab === "categories" || params.tab === "brands" || params.tab === "needs-attention" ? params.tab : "catalogue";
  const sort = params.sort === "name" || params.sort === "price" || params.sort === "stock" || params.sort === "validation" || params.sort === "publication" ? params.sort : "updated";
  const order = params.order === "asc" ? "asc" as const : "desc" as const;
  const filters: Prisma.ProductWhereInput[] = [];
  if (q) {
    filters.push({
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { slug: { contains: q, mode: "insensitive" as const } },
        { sku: { contains: q, mode: "insensitive" as const } },
        { modelNumber: { contains: q, mode: "insensitive" as const } },
        { brand: { contains: q, mode: "insensitive" as const } },
        { manufacturer: { contains: q, mode: "insensitive" as const } },
      ],
    });
  }
  if (productName) filters.push({ name: { contains: productName, mode: "insensitive" as const } });
  if (modelNumber) filters.push({ modelNumber: { contains: modelNumber, mode: "insensitive" as const } });
  if (supplierSku) filters.push({ sku: { contains: supplierSku, mode: "insensitive" as const } });
  if (manufacturer) filters.push({ manufacturer: { contains: manufacturer, mode: "insensitive" as const } });
  const minPriceNumber = minPrice ? Number(minPrice) : null;
  const maxPriceNumber = maxPrice ? Number(maxPrice) : null;
  if (Number.isFinite(minPriceNumber)) filters.push({ price: { gte: minPriceNumber as number } });
  if (Number.isFinite(maxPriceNumber)) filters.push({ price: { lte: maxPriceNumber as number } });
  if (activeTab === "needs-attention") {
    filters.push({ stock: { lte: 5 } });
  }
  if (stockState === "in-stock") filters.push({ stock: { gt: 0 } });
  if (stockState === "out-of-stock") filters.push({ stock: 0 });
  if (stockState === "low-stock") filters.push({ stock: { gt: 0, lte: 5 } });
  const where: Prisma.ProductWhereInput = {
    ...(deleted ? { deletedAt: { not: null } } : { deletedAt: null }),
    ...(!deleted ? (archived ? { archivedAt: { not: null } } : { archivedAt: null }) : {}),
    ...(filters.length ? { AND: filters } : {}),
    ...(status ? { status } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(brand ? { brand } : {}),
  };
  const orderBy =
    sort === "name" ? { name: order } as const :
    sort === "price" ? { price: order } as const :
    sort === "stock" ? { stock: order } as const :
    { updatedAt: order } as const;
  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (productName) baseParams.set("productName", productName);
  if (modelNumber) baseParams.set("modelNumber", modelNumber);
  if (supplierSku) baseParams.set("supplierSku", supplierSku);
  if (status) baseParams.set("status", status);
  if (validationStatus) baseParams.set("validationStatus", validationStatus);
  if (categoryId) baseParams.set("category", categoryId);
  if (brand) baseParams.set("brand", brand);
  if (manufacturer) baseParams.set("manufacturer", manufacturer);
  if (stockState) baseParams.set("stockState", stockState);
  if (minPrice) baseParams.set("minPrice", minPrice);
  if (maxPrice) baseParams.set("maxPrice", maxPrice);
  if (missingRequired) baseParams.set("missingRequired", "true");
  if (missingImage1) baseParams.set("missingImage1", "true");
  if (missingImage2) baseParams.set("missingImage2", "true");
  if (thirdImage) baseParams.set("thirdImage", thirdImage);
  if (warrantyState) baseParams.set("warrantyState", warrantyState);
  if (archived) baseParams.set("archived", "true");
  if (deleted) baseParams.set("deleted", "true");
  if (activeTab !== "catalogue") baseParams.set("tab", activeTab);
  if (sort !== "updated") baseParams.set("sort", sort);
  if (order !== "desc") baseParams.set("order", order);
  if (currentPageSize !== pageSize) baseParams.set("pageSize", String(currentPageSize));

  const [categories, suppliers, manufacturerRows, managedBrands, allProducts] = await Promise.all([
    prisma.category.findMany({ include: { parent: true }, orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }] }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ distinct: ["manufacturer"], select: { manufacturer: true }, where: { manufacturer: { not: null } }, orderBy: { manufacturer: "asc" } }),
    prisma.brand.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.product.findMany({
      where,
      include: { category: true, supplier: true, media: { where: { type: "IMAGE" }, orderBy: { createdAt: "asc" } }, campaigns: { include: { campaign: true } } },
      orderBy,
    }),
  ]);
  const editProduct = params.edit && params.edit !== "new"
    ? await prisma.product.findUnique({ where: { id: params.edit }, include: { category: true, supplier: true, media: { where: { type: "IMAGE" }, orderBy: { createdAt: "asc" } } } })
    : null;
  const brandOptions = Array.from(new Set(managedBrands.map((item) => item.name).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const skuCounts = new Map<string, number>();
  for (const product of allProducts) {
    const key = product.sku?.trim().toLowerCase();
    if (key) skuCounts.set(key, (skuCounts.get(key) ?? 0) + 1);
  }
  const decoratedProducts = allProducts.map((product) => {
    const duplicateSku = product.sku ? (skuCounts.get(product.sku.trim().toLowerCase()) ?? 0) > 1 : false;
    const validation = validateProductReadiness(product, duplicateSku);
    const displayStatus = productDisplayStatus(product, duplicateSku);
    const imageUrls = productImageUrls(product);
    return { product, duplicateSku, validation, displayStatus, imageUrls };
  });
  const validationRank: Record<string, number> = { "Has Errors": 0, "Draft": 1, "Ready to Publish": 2, "Published": 3 };
  const publicationRank: Record<string, number> = { DRAFT: 0, PUBLISHED: 1, ARCHIVED: 2 };
  const filteredProducts = decoratedProducts.filter(({ product, validation, displayStatus, imageUrls }) => {
    if (validationStatus === "ready" && displayStatus !== "Ready to Publish") return false;
    if (validationStatus === "errors" && validation.ready) return false;
    if (validationStatus === "published" && displayStatus !== "Published") return false;
    if (validationStatus === "draft" && displayStatus !== "Draft") return false;
    if (missingRequired && validation.ready) return false;
    if (missingImage1 && imageUrls[0]) return false;
    if (missingImage2 && imageUrls[1]) return false;
    if (thirdImage === "present" && !imageUrls[2]) return false;
    if (thirdImage === "absent" && imageUrls[2]) return false;
    if (warrantyState === "present" && !product.warranty) return false;
    if (warrantyState === "missing" && product.warranty) return false;
    return true;
  }).sort((a, b) => {
    const direction = order === "asc" ? 1 : -1;
    if (sort === "validation") return ((validationRank[a.displayStatus] ?? 99) - (validationRank[b.displayStatus] ?? 99)) * direction;
    if (sort === "publication") return ((publicationRank[a.product.status] ?? 99) - (publicationRank[b.product.status] ?? 99)) * direction;
    return 0;
  });
  const totalProducts = filteredProducts.length;
  const products = filteredProducts.slice((currentPage - 1) * currentPageSize, currentPage * currentPageSize);
  const readyResultIds = filteredProducts.filter((item) => item.displayStatus === "Ready to Publish").map((item) => item.product.id);
  const totalPages = Math.max(1, Math.ceil(totalProducts / currentPageSize));

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-orange-600">Catalogue operations</p>
          <h1 className="text-2xl font-black text-slate-950">Product manager</h1>
          <p className="mt-1 text-sm text-slate-500">Search, filter, preview, edit catalogue details, manage stock status, and complete the validated image set.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={editHref(baseParams, "new")} className="inline-flex min-h-10 items-center justify-center rounded-md bg-orange-500 px-4 py-2 text-sm font-black text-white hover:bg-orange-600">Add product</Link>
          <Link href="/admin/import" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50">
            <FileSpreadsheet className="h-4 w-4" />
            Catalogue Import
          </Link>
        </div>
      </div>

      {params.notice === "data-management-moved" ? (
        <div className="mb-5 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-900" role="status">
          Standalone Data Management has moved. Product archive, restore, editing, image, category, and brand actions now live on this page.
        </div>
      ) : null}

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {[
          ["catalogue", "Catalogue"],
          ["categories", "Categories"],
          ["brands", "Brands"],
          ["archived", "Archived"],
          ["deleted", "Deleted"],
          ["needs-attention", "Needs Attention"],
        ].map(([value, label]) => (
          <Link
            key={value}
            href={pageHref({
              page: 1,
              q,
              productName,
              modelNumber,
              supplierSku,
              status,
              validationStatus,
              category: categoryId,
              brand,
              manufacturer,
              stockState,
              minPrice,
              maxPrice,
              missingRequired,
              missingImage1,
              missingImage2,
              thirdImage,
              warrantyState,
              tab: value === "catalogue" ? undefined : value,
              archived: value === "archived" ? "true" : undefined,
              deleted: value === "deleted" ? "true" : undefined,
              sort,
              order,
              pageSize: currentPageSize,
            })}
            className={`whitespace-nowrap rounded-md border px-3 py-2 text-sm font-black ${activeTab === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <form className="mb-3 grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-6">
        <label className="relative">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input name="q" defaultValue={q} placeholder="Search name, SKU, slug, or brand" className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm" />
        </label>
        <input name="productName" defaultValue={productName} placeholder="Product name" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        <input name="brand" list="brand-filter-options" defaultValue={brand} placeholder="Brand" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        <input name="modelNumber" defaultValue={modelNumber} placeholder="Model number" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        <input name="supplierSku" defaultValue={supplierSku} placeholder="Supplier SKU" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        <input name="manufacturer" list="manufacturer-filter-options" defaultValue={manufacturer} placeholder="Manufacturer" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        <input type="hidden" name="tab" value={activeTab} />
        {archived ? <input type="hidden" name="archived" value="true" /> : null}
        {deleted ? <input type="hidden" name="deleted" value="true" /> : null}
        <select name="publicationStatus" defaultValue={status} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">All publication statuses</option>
          {productStatuses.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
        </select>
        <select name="validationStatus" defaultValue={validationStatus} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">All validation statuses</option>
          <option value="ready">Ready to Publish</option>
          <option value="errors">Has Errors</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select name="category" defaultValue={categoryId} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.parent ? `${category.parent.name} / ` : ""}{category.name}</option>
          ))}
        </select>
        <select name="stockState" defaultValue={stockState} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">All stock states</option>
          <option value="in-stock">In stock</option>
          <option value="out-of-stock">Out of stock</option>
          <option value="low-stock">Low stock</option>
        </select>
        <input name="minPrice" defaultValue={minPrice} type="number" min="0" step="0.01" placeholder="Minimum price" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        <input name="maxPrice" defaultValue={maxPrice} type="number" min="0" step="0.01" placeholder="Maximum price" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        <select name="thirdImage" defaultValue={thirdImage} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">Third image any</option>
          <option value="present">Third image present</option>
          <option value="absent">Third image absent</option>
        </select>
        <select name="warrantyState" defaultValue={warrantyState} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">Warranty any</option>
          <option value="present">Warranty present</option>
          <option value="missing">Warranty missing</option>
        </select>
        <select name="sort" defaultValue={sort} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
          <option value="updated">Newest</option>
          <option value="name">Product name</option>
          <option value="price">Price</option>
          <option value="stock">Stock</option>
          <option value="validation">Validation status</option>
          <option value="publication">Publication status</option>
        </select>
        <select name="order" defaultValue={order} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
        <select name="pageSize" defaultValue={currentPageSize} className="h-10 rounded-md border border-slate-300 px-3 text-sm">
          {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size} rows</option>)}
        </select>
        <label className="flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700">
          <input type="checkbox" name="missingRequired" value="true" defaultChecked={missingRequired} className="accent-orange-500" />
          Missing required fields
        </label>
        <label className="flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700">
          <input type="checkbox" name="missingImage1" value="true" defaultChecked={missingImage1} className="accent-orange-500" />
          Missing Product Image 1
        </label>
        <label className="flex min-h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700">
          <input type="checkbox" name="missingImage2" value="true" defaultChecked={missingImage2} className="accent-orange-500" />
          Missing Product Image 2
        </label>
        <button className="min-h-10 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">Filter</button>
        <datalist id="brand-filter-options">{brandOptions.map((item) => <option key={item} value={item} />)}</datalist>
        <datalist id="manufacturer-filter-options">{manufacturerRows.map((item) => item.manufacturer ? <option key={item.manufacturer} value={item.manufacturer} /> : null)}</datalist>
      </form>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">Active filters</span>
        {[
          q && `Search: ${q}`,
          productName && `Name: ${productName}`,
          modelNumber && `Model: ${modelNumber}`,
          supplierSku && `SKU: ${supplierSku}`,
          brand && `Brand: ${brand}`,
          manufacturer && `Manufacturer: ${manufacturer}`,
          status && `Publication: ${status.replaceAll("_", " ")}`,
          validationStatus && `Validation: ${validationStatus}`,
          categoryId && `Category: ${categories.find((item) => item.id === categoryId)?.name ?? "Selected"}`,
          stockState && `Stock: ${stockState.replace("-", " ")}`,
          minPrice && `Min: ${minPrice}`,
          maxPrice && `Max: ${maxPrice}`,
          missingRequired && "Missing required fields",
          missingImage1 && "Missing image 1",
          missingImage2 && "Missing image 2",
          thirdImage && `Third image: ${thirdImage}`,
          warrantyState && `Warranty: ${warrantyState}`,
        ].filter(Boolean).map((label) => <span key={label as string} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">{label}</span>)}
        <Link href="/admin/products" className="inline-flex min-h-8 items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-black text-slate-700 hover:bg-slate-50"><X className="h-3 w-3" /> Clear all filters</Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-5">
          <ProductManagementTable
            products={products.map(({ product, validation, displayStatus, imageUrls }) => ({
              id: product.id,
              name: product.name,
              slug: product.slug,
              editHref: editHref(baseParams, product.id),
              imageManagerHref: `/admin/media?q=${encodeURIComponent(product.name)}`,
              storefrontHref: product.status === "PUBLISHED" && !product.archivedAt ? `/products/${product.slug}` : null,
              sku: product.sku,
              modelNumber: product.modelNumber,
              manufacturer: product.manufacturer,
              brand: product.brand,
              category: product.category.name,
              categoryId: product.categoryId,
              price: money(product.price),
              discountPrice: money(product.discountPrice),
              stock: product.stock,
              lowStockThreshold: product.lowStockThreshold,
              status: product.status,
              displayStatus,
              validationIssues: validation.issues,
              readyToPublish: displayStatus === "Ready to Publish",
              badges: product.badges,
              imageUrl: product.imageUrl,
              imageUrls,
              archived: Boolean(product.archivedAt),
              updatedAt: product.updatedAt.toLocaleDateString("en-KE"),
            }))}
            totalCount={totalProducts}
            pageSize={currentPageSize}
            readyResultIds={readyResultIds}
          />

          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
            <span>Showing {products.length ? (currentPage - 1) * currentPageSize + 1 : 0}-{Math.min(currentPage * currentPageSize, totalProducts)} of {totalProducts}</span>
            <div className="flex gap-2">
              <Link aria-disabled={currentPage <= 1} className={`rounded-md border px-3 py-2 font-bold ${currentPage <= 1 ? "pointer-events-none text-slate-400" : "hover:bg-slate-50"}`} href={pageHref({ page: Math.max(1, currentPage - 1), q, productName, modelNumber, supplierSku, status, validationStatus, category: categoryId, brand, manufacturer, stockState, minPrice, maxPrice, missingRequired, missingImage1, missingImage2, thirdImage, warrantyState, archived: archived ? "true" : undefined, deleted: deleted ? "true" : undefined, tab: activeTab, sort, order, pageSize: currentPageSize })}>Previous</Link>
              <Link aria-disabled={currentPage >= totalPages} className={`rounded-md border px-3 py-2 font-bold ${currentPage >= totalPages ? "pointer-events-none text-slate-400" : "hover:bg-slate-50"}`} href={pageHref({ page: Math.min(totalPages, currentPage + 1), q, productName, modelNumber, supplierSku, status, validationStatus, category: categoryId, brand, manufacturer, stockState, minPrice, maxPrice, missingRequired, missingImage1, missingImage2, thirdImage, warrantyState, archived: archived ? "true" : undefined, deleted: deleted ? "true" : undefined, tab: activeTab, sort, order, pageSize: currentPageSize })}>Next</Link>
            </div>
          </div>
        </div>

        <aside className="sticky top-24 self-start rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          {activeTab === "categories" && !params.edit ? (
            <CategoryManager categories={categories} />
          ) : activeTab === "brands" && !params.edit ? (
            <BrandManager brands={managedBrands} productBrands={brandOptions} />
          ) : params.edit ? (
            <>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-950">{params.edit === "new" ? "Add product" : `Edit ${editProduct?.name ?? "product"}`}</h2>
                  <p className="mt-1 text-sm text-slate-500">Changes are saved through validated server actions. Refresh if a version conflict is reported.</p>
                </div>
                <Link href={`/admin/products?${baseParams.toString()}`} className="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-50" aria-label="Close editor"><X className="h-4 w-4" /></Link>
              </div>
              <ProductForm action={params.edit === "new" ? createProduct : updateProduct} categories={categories} suppliers={suppliers} brandOptions={brandOptions} product={editProduct ?? undefined} submitLabel={params.edit === "new" ? "Create product" : "Save product"} />
            </>
          ) : (
            <>
              <h2 className="text-lg font-black text-slate-950">Publication readiness</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <p>Products can be published once the record is complete and at least one usable image is attached.</p>
                <p>Publishing is manual. Imports create draft records only.</p>
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

function CategoryManager({ categories }: { categories: Array<{ id: string; name: string; parent: { name: string } | null; sortOrder: number; archivedAt: Date | null }> }) {
  return (
    <div>
      <h2 className="text-lg font-black text-slate-950">Categories</h2>
      <p className="mt-1 text-sm text-slate-500">Create catalogue categories here; product assignment happens in the editor or bulk action bar.</p>
      <form action={createCategory} className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">Name<input name="name" required className="h-10 rounded-md border border-slate-300 bg-white px-3" /></label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">Parent<select name="parentId" className="h-10 rounded-md border border-slate-300 bg-white px-3"><option value="">Top level</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.parent ? `${category.parent.name} / ` : ""}{category.name}</option>)}</select></label>
        <input type="hidden" name="sortOrder" value="0" />
        <PendingSubmitButton idleLabel="Add category" pendingLabel="Saving category" />
      </form>
      <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
        {categories.map((category) => (
          <div key={category.id} className="rounded-md border border-slate-200 p-3 text-sm">
            <p className="font-black text-slate-950">{category.parent ? `${category.parent.name} / ` : ""}{category.name}</p>
            <p className="text-xs text-slate-500">Sort {category.sortOrder}{category.archivedAt ? " - archived" : ""}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrandManager({ brands, productBrands }: { brands: Array<{ id: string; name: string; website: string | null; isActive: boolean; sortOrder: number }>; productBrands: string[] }) {
  return (
    <div>
      <h2 className="text-lg font-black text-slate-950">Brands</h2>
      <p className="mt-1 text-sm text-slate-500">Manage storefront brand records and review catalogue brand coverage.</p>
      <form action={createBrand} className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">Name<input name="name" required className="h-10 rounded-md border border-slate-300 bg-white px-3" /></label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">Website<input name="website" type="url" className="h-10 rounded-md border border-slate-300 bg-white px-3" /></label>
        <input type="hidden" name="sortOrder" value="0" />
        <input type="hidden" name="isActive" value="on" />
        <PendingSubmitButton idleLabel="Add brand" pendingLabel="Saving brand" />
      </form>
      <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
        {brands.map((brand) => (
          <div key={brand.id} className="rounded-md border border-slate-200 p-3 text-sm">
            <p className="font-black text-slate-950">{brand.name}</p>
            <p className="text-xs text-slate-500">{brand.isActive ? "Active" : "Inactive"} - sort {brand.sortOrder}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-md bg-slate-50 p-3">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Catalogue brand values</p>
        <p className="mt-2 text-sm font-semibold text-slate-700">{productBrands.slice(0, 12).join(", ") || "No product brands yet."}</p>
      </div>
    </div>
  );
}

function ProductForm({
  action,
  categories,
  suppliers,
  brandOptions,
  product,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  categories: Array<{ id: string; name: string; parent: { name: string } | null }>;
  suppliers: Array<{ id: string; name: string }>;
  brandOptions: string[];
  product?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    sku: string | null;
    modelNumber: string | null;
    manufacturer: string | null;
    manufacturerProductUrl: string | null;
    datasheetUrl: string | null;
    warranty: string | null;
    barcode: string | null;
    brand: string;
    costPrice: unknown;
    price: { toString(): string } | number | string;
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
    category: { id: string; name: string };
      media?: Array<{
        id: string;
        url: string;
        fileName: string;
        source?: string | null;
      }>;
  };
  submitLabel: string;
}) {
  const currentImageUrls = productImageUrls(product ?? {});
  const validation = product
    ? validateProductReadiness({
        ...product,
        media: product.media,
      })
    : null;
  const errorFor = (field: string) => validation?.issues.find((issue) => issue.field === field)?.message;

  return (
    <form action={action} className="mt-5 grid gap-5">
      {product ? <input type="hidden" name="productId" value={product.id} /> : null}
      {validation && validation.issues.length > 0 ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">
          <p className="font-black">Fix these fields before publishing.</p>
          <ul className="mt-2 space-y-1">
            {validation.issues.map((issue) => <li key={issue.field}>{issue.field}: {issue.message}</li>)}
          </ul>
        </div>
      ) : product ? (
        <div className="rounded-md border border-sky-200 bg-sky-50 p-4 text-sm font-black text-sky-800" role="status">
          This product is Ready to Publish.
        </div>
      ) : null}
      <EditorSection title="Basic Information">
        <InputField name="name" label="Product name" required defaultValue={product?.name} error={errorFor("Product Name")} />
        <InputField name="slug" label="Slug" defaultValue={product?.slug} placeholder="auto-generated if blank" />
        <InputField name="sku" label="Supplier SKU" required defaultValue={product?.sku ?? ""} error={errorFor("Supplier SKU")} />
        <InputField name="modelNumber" label="Model number" required defaultValue={product?.modelNumber ?? ""} error={errorFor("Model Number")} />
        <InputField name="barcode" label="Barcode" defaultValue={product?.barcode ?? ""} />
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Brand
          <input name="brand" required list={`brand-options-${product?.id ?? "new"}`} defaultValue={product?.brand} className="h-10 rounded-md border border-slate-300 px-3" />
          <datalist id={`brand-options-${product?.id ?? "new"}`}>
            {brandOptions.map((item) => <option key={item} value={item} />)}
          </datalist>
          {errorFor("Brand") ? <span className="text-xs font-bold text-red-700">{errorFor("Brand")}</span> : null}
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
          Category
          <select name="categoryId" required defaultValue={product?.categoryId ?? ""} className="h-10 rounded-md border border-slate-300 px-3">
            <option value="">Select category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.parent ? `${category.parent.name} / ` : ""}{category.name}</option>)}
          </select>
          {errorFor("Category") ? <span className="text-xs font-bold text-red-700">{errorFor("Category")}</span> : null}
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
          Description
          <textarea name="description" required rows={4} defaultValue={product?.description} className="rounded-md border border-slate-300 px-3 py-2" />
          {errorFor("Description") ? <span className="text-xs font-bold text-red-700">{errorFor("Description")}</span> : null}
        </label>
      </EditorSection>

      <EditorSection title="Pricing">
        <InputField name="costPrice" label="Cost price" type="number" min="0" step="0.01" defaultValue={String(product?.costPrice ?? "")} />
        <InputField name="price" label="Selling price" required type="number" min="0.01" step="0.01" defaultValue={String(product?.price ?? "")} error={errorFor("Price")} />
        <InputField name="discountPrice" label="Discount price" type="number" min="0" step="0.01" defaultValue={String(product?.discountPrice ?? "")} />
        <InputField name="taxRate" label="Tax" type="number" min="0" step="0.01" defaultValue={String(product?.taxRate ?? "16")} />
        <div className="rounded-md bg-slate-50 p-3 text-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Profit margin</p>
          <p className="mt-1 text-xl font-black text-slate-950">{margin(product?.costPrice, product?.price)}</p>
        </div>
      </EditorSection>

      <EditorSection title="Inventory">
        <InputField name="stock" label="Stock quantity" required type="number" min="0" step="1" defaultValue={String(product?.stock ?? 0)} error={errorFor("Stock")} />
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
        {product ? (
          <div className="md:col-span-2">
            <div className="mb-3 grid gap-3 sm:grid-cols-3">
              {Array.from(new Set([product.imageUrl, ...(product.media ?? []).map((item) => item.url)].filter(Boolean))).slice(0, 6).map((url, index) => (
                <div key={`${url}-${index}`} className="overflow-hidden rounded-md border border-slate-200 bg-white">
                  <div className="relative aspect-square bg-slate-100">
                    <Image src={url as string} alt={`${product.name} preview ${index + 1}`} fill sizes="180px" className="object-contain p-3" />
                  </div>
                  <p className="px-3 py-2 text-xs font-bold text-slate-600">{index === 0 ? "Primary" : "Additional"} preview</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <InputField name="imageUrl" label="Product Image 1 URL" required type="url" defaultValue={currentImageUrls[0] ?? ""} placeholder="https://..." error={errorFor("Product Image 1 URL")} />
        <InputField name="productImage2Url" label="Product Image 2 URL" required type="url" defaultValue={currentImageUrls[1] ?? ""} placeholder="https://..." error={errorFor("Product Image 2 URL")} />
        <InputField name="productImage3Url" label="Product Image 3 URL (Optional)" type="url" defaultValue={currentImageUrls[2] ?? ""} placeholder="https://..." error={errorFor("Product Image 3 URL")} />
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
        <InputField name="manufacturer" label="Manufacturer" required defaultValue={product?.manufacturer ?? ""} error={errorFor("Manufacturer")} />
        <InputField name="manufacturerProductUrl" label="Manufacturer product URL" type="url" defaultValue={product?.manufacturerProductUrl ?? ""} />
        <InputField name="datasheetUrl" label="Datasheet URL" type="url" defaultValue={product?.datasheetUrl ?? ""} />
        <InputField name="warranty" label="Warranty" required defaultValue={product?.warranty ?? ""} error={errorFor("Warranty")} />
        <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
          Dynamic attributes
          <textarea
            name="specifications"
            rows={7}
            defaultValue={specificationsToText(product?.specifications)}
            placeholder={"Print technology: Laser\nPages per minute: 40\nColour/Mono: Mono\nConnectivity: USB, Wi-Fi\nPaper size: A4\nDuty cycle: 80000"}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
          {errorFor("Specifications") ? <span className="text-xs font-bold text-red-700">{errorFor("Specifications")}</span> : null}
        </label>
      </EditorSection>

      <PendingSubmitButton idleLabel={submitLabel} pendingLabel="Saving changes" icon={<Save className="h-4 w-4" />} />
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
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <input {...props} aria-invalid={Boolean(error)} className={`h-10 rounded-md border px-3 ${error ? "border-red-300" : "border-slate-300"}`} />
      {error ? <span className="text-xs font-bold text-red-700">{error}</span> : null}
    </label>
  );
}
