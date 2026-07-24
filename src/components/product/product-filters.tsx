import Link from "next/link";
import { Eye, Grid2X2, List, MessageCircle, Search, SlidersHorizontal, Tag, X } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { BuyNowButton } from "@/components/product/buy-now-button";
import { ProductVisual } from "@/components/product/product-visual";
import { ButtonLink } from "@/components/ui/button";
import { SearchSubmitButton } from "@/components/forms/search-submit-button";
import { formatCurrency } from "@/lib/utils";
import { productOrderMessage, whatsappUrl } from "@/lib/whatsapp";
import type { CatalogueCategory, CataloguePageResult } from "@/lib/catalog";
import type { Product } from "@/types";

type BrandFacet = {
  name: string;
  productCount: number;
};

type FilterState = {
  q?: string;
  category?: string;
  brand?: string;
  stock?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  view?: string;
};

function paramsWith(filters: FilterState, updates: Record<string, string | number | null | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries({ ...filters, ...updates })) {
    if (value !== undefined && value !== null && String(value).trim() !== "" && value !== "All") {
      params.set(key, String(value));
    }
  }

  const query = params.toString();

  return query ? `/products?${query}` : "/products";
}

export function ProductFilters({
  result,
  categories,
  brands,
  filters,
  minPrice,
  maxPrice,
}: {
  result: CataloguePageResult;
  categories: CatalogueCategory[];
  brands: BrandFacet[];
  filters: FilterState;
  minPrice: number;
  maxPrice: number;
}) {
  const view = filters.view === "list" ? "list" : "grid";
  const activeFilters = [
    filters.q ? ["Search", filters.q] : null,
    filters.category ? ["Category", categories.find((category) => category.slug === filters.category)?.name ?? filters.category] : null,
    filters.brand ? ["Brand", filters.brand] : null,
    filters.stock ? ["Stock", filters.stock === "available" ? "Available" : "Out of stock"] : null,
    filters.type ? ["Type", filters.type] : null,
    filters.minPrice ? ["Min", formatCurrency(Number(filters.minPrice))] : null,
    filters.maxPrice ? ["Max", formatCurrency(Number(filters.maxPrice))] : null,
  ].filter(Boolean) as [string, string][];

  const productTypes = ["Printer", "Photocopier", "Toner", "Cartridge", "Laptop", "Computer", "Router", "Switch", "UPS"];

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      <details className="rounded-md border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
        <summary className="flex min-h-11 items-center justify-between text-sm font-black text-slate-950">
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-orange-500" />
            Filters
          </span>
        </summary>
        <FilterForm categories={categories} brands={brands} filters={filters} minPrice={minPrice} maxPrice={maxPrice} productTypes={productTypes} compact />
      </details>

      <aside className="hidden h-fit rounded-md border border-slate-200 bg-white p-5 shadow-sm lg:block">
        <FilterForm categories={categories} brands={brands} filters={filters} minPrice={minPrice} maxPrice={maxPrice} productTypes={productTypes} />
      </aside>

      <div>
        <div className="mb-5 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black text-slate-950">
                {result.total} products found
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Page {result.page} of {result.pageCount}. Showing up to {result.pageSize} products per page.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={paramsWith(filters, { view: "grid", page: 1 })} className={`grid h-10 w-10 place-items-center rounded-md border ${view === "grid" ? "border-orange-300 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-600"}`} aria-label="Grid view">
                <Grid2X2 className="h-4 w-4" />
              </Link>
              <Link href={paramsWith(filters, { view: "list", page: 1 })} className={`grid h-10 w-10 place-items-center rounded-md border ${view === "list" ? "border-orange-300 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-600"}`} aria-label="List view">
                <List className="h-4 w-4" />
              </Link>
            </div>
          </div>
          {activeFilters.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeFilters.map(([label, value]) => (
                <span key={`${label}-${value}`} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                  {label}: {value}
                </span>
              ))}
              <ButtonLink href="/products" variant="ghost" className="min-h-8 px-2 py-1 text-xs">
                <X className="h-3.5 w-3.5" />
                Clear
              </ButtonLink>
            </div>
          ) : null}
        </div>

        {result.products.length > 0 ? (
          <div className={view === "list" ? "grid gap-4" : "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"}>
            {result.products.map((product) =>
              view === "list" ? (
                <ProductListRow key={product.id} product={product} />
              ) : (
                <ProductCard key={product.id} product={product} />
              ),
            )}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-xl font-black text-slate-950">No matching products</h2>
            <p className="mt-2 text-sm text-slate-600">Try removing a filter, widening the price range, or searching by brand, model, toner number, or SKU.</p>
            <ButtonLink href="/products" className="mt-5 w-fit">Reset catalogue</ButtonLink>
          </div>
        )}

        <Pagination result={result} filters={filters} />
      </div>
    </div>
  );
}

function ProductListRow({ product }: { product: Product }) {
  const salePrice = product.discountPrice ?? product.price;
  const savings = product.discountPrice ? product.price - product.discountPrice : 0;
  const primaryBadge = product.badges[0]?.replaceAll("_", " ") ?? null;

  return (
    <article className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-300 hover:shadow-md md:grid-cols-[220px_1fr_230px]">
      <div className="relative">
        <ProductVisual product={product} />
        {primaryBadge ? (
          <span className="absolute left-3 top-3 rounded bg-orange-500 px-2 py-1 text-[11px] font-black uppercase text-white shadow-sm">
            {primaryBadge}
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-black uppercase text-orange-700">{product.subcategory}</p>
          {product.brand ? (
            <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-700">
              {product.brand}
            </span>
          ) : null}
        </div>
        <Link href={`/products/${product.slug}`} className="mt-2 block text-lg font-black leading-6 text-slate-950 hover:text-orange-700">
          {product.name}
        </Link>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{product.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
          <span>{product.categoryPath}</span>
          {product.sku ? <span>SKU: {product.sku}</span> : null}
        </div>
      </div>
      <div className="flex flex-col justify-between gap-4 md:border-l md:border-slate-200 md:pl-4">
        <div>
          <p className="text-2xl font-black leading-none text-slate-950">{formatCurrency(salePrice)}</p>
          {product.discountPrice ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-400 line-through">{formatCurrency(product.price)}</p>
              <p className="inline-flex items-center gap-1 text-xs font-black text-emerald-700">
                <Tag className="h-3 w-3" />
                Save {formatCurrency(savings)}
              </p>
            </div>
          ) : null}
          <span
            className={
              product.availability === "Out of stock"
                ? "mt-3 inline-flex rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-700"
                : "mt-3 inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700"
            }
          >
            {product.availability}
          </span>
        </div>
        <div className="grid gap-2">
          <AddToCartButton product={product} className="w-full" />
          <BuyNowButton product={product} className="w-full" />
          <div className="grid grid-cols-2 gap-2">
            <ButtonLink href={`/products/${product.slug}`} variant="outline" className="w-full">
              <Eye className="h-4 w-4" />
              Details
            </ButtonLink>
            <ButtonLink href={whatsappUrl(productOrderMessage(product))} variant="ghost" className="w-full border border-slate-200">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </ButtonLink>
          </div>
        </div>
      </div>
    </article>
  );
}

function FilterForm({
  categories,
  brands,
  filters,
  minPrice,
  maxPrice,
  productTypes,
  compact = false,
}: {
  categories: CatalogueCategory[];
  brands: BrandFacet[];
  filters: FilterState;
  minPrice: number;
  maxPrice: number;
  productTypes: string[];
  compact?: boolean;
}) {
  return (
    <form action="/products" className={`grid gap-4 ${compact ? "mt-4" : ""}`}>
      <div className="flex items-center gap-2 text-lg font-black text-slate-950">
        <SlidersHorizontal className="h-5 w-5 text-orange-500" />
        Refine catalogue
      </div>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Search
        <span className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={filters.q ?? ""} className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3" placeholder="Model, toner, brand, SKU..." />
        </span>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Category
        <select name="category" defaultValue={filters.category ?? ""} className="h-11 rounded-md border border-slate-200 px-3">
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.parentName ? `${category.parentName} / ${category.name}` : category.name} ({category.productCount})
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Brand
        <select name="brand" defaultValue={filters.brand ?? ""} className="h-11 rounded-md border border-slate-200 px-3">
          <option value="">All brands</option>
          {brands.map((brand) => (
            <option key={brand.name} value={brand.name}>
              {brand.name} ({brand.productCount})
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Product type
        <select name="type" defaultValue={filters.type ?? ""} className="h-11 rounded-md border border-slate-200 px-3">
          <option value="">All types</option>
          {productTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Stock
        <select name="stock" defaultValue={filters.stock ?? ""} className="h-11 rounded-md border border-slate-200 px-3">
          <option value="">All stock states</option>
          <option value="available">Available</option>
          <option value="out">Out of stock</option>
        </select>
      </label>
      <div className="grid gap-2 text-sm font-semibold text-slate-700">
        Price range
        <div className="grid grid-cols-2 gap-2">
          <input name="minPrice" type="number" min="0" step="500" defaultValue={filters.minPrice ?? ""} placeholder={formatCurrency(minPrice || 0)} className="h-11 rounded-md border border-slate-200 px-3" aria-label="Minimum price" />
          <input name="maxPrice" type="number" min="0" step="500" defaultValue={filters.maxPrice ?? ""} placeholder={formatCurrency(maxPrice || 0)} className="h-11 rounded-md border border-slate-200 px-3" aria-label="Maximum price" />
        </div>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Sort
        <select name="sort" defaultValue={filters.sort ?? "newest"} className="h-11 rounded-md border border-slate-200 px-3">
          <option value="newest">Newest products</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
          <option value="name">Name A-Z</option>
        </select>
      </label>
      <input type="hidden" name="view" value={filters.view ?? "grid"} />
      <SearchSubmitButton idleLabel="Apply filters" pendingLabel="Applying filters" className="min-h-11 rounded-md bg-slate-950 px-4 py-2 text-white hover:bg-orange-600" />
      <Link href="/products" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-100">
        <X className="h-4 w-4" />
        Clear filters
      </Link>
    </form>
  );
}

function Pagination({ result, filters }: { result: CataloguePageResult; filters: FilterState }) {
  if (result.pageCount <= 1) return null;

  const pages = Array.from({ length: result.pageCount })
    .map((_, index) => index + 1)
    .filter((page) => page === 1 || page === result.pageCount || Math.abs(page - result.page) <= 1);

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Product pagination">
      <Link href={paramsWith(filters, { page: Math.max(result.page - 1, 1) })} aria-disabled={result.page === 1} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 aria-disabled:pointer-events-none aria-disabled:opacity-50">
        Previous
      </Link>
      {pages.map((page, index) => {
        const previous = pages[index - 1];

        return (
          <span key={page} className="inline-flex items-center gap-2">
            {previous && page - previous > 1 ? <span className="text-slate-400">...</span> : null}
            <Link href={paramsWith(filters, { page })} aria-current={page === result.page ? "page" : undefined} className="grid h-10 min-w-10 place-items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 aria-current:border-orange-400 aria-current:bg-orange-50 aria-current:text-orange-700">
              {page}
            </Link>
          </span>
        );
      })}
      <Link href={paramsWith(filters, { page: Math.min(result.page + 1, result.pageCount) })} aria-disabled={result.page === result.pageCount} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 aria-disabled:pointer-events-none aria-disabled:opacity-50">
        Next
      </Link>
    </nav>
  );
}
