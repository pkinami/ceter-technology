import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home, Search } from "lucide-react";
import { ProductFilters } from "@/components/product/product-filters";
import {
  getCatalogueBrands,
  getCatalogueCategories,
  getPublicProducts,
} from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse printers, ink cartridges, toners, printer accessories, scanners, UPS systems, and office equipment.",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: Props) {
  const { q, category } = await searchParams;
  const [products, categories, brands] = await Promise.all([
    getPublicProducts(),
    getCatalogueCategories(),
    getCatalogueBrands(),
  ]);
  const categoryGroups = categories
    .filter((category) => !category.parentName)
    .map((category) => ({
      name: category.name,
      items: categories
        .filter((item) => item.parentName === category.name)
        .map((item) => item.name),
    }));
  const filterCategories = Array.from(
    new Set(categories.flatMap((category) => [category.parentName, category.name]).filter(Boolean)),
  ) as string[];

  return (
    <div className="bg-slate-50">
      <section className="bg-slate-950 px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-orange-300">
              CETER product marketplace
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-normal">
              Search, compare, and order business technology
            </h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Printers, consumables, computers, networking, power protection, security systems, and ICT services in one catalogue.
            </p>
          </div>
          <form action="/products" className="rounded-lg border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur">
            <label className="relative block">
              <span className="sr-only">Search catalogue</span>
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Try HP 107A toner, Epson EcoTank, Dell laptop, router..."
                className="h-14 w-full rounded-md border border-white/10 bg-white pl-12 pr-32 text-sm font-semibold text-slate-950"
              />
              <button className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-md bg-orange-500 px-4 text-sm font-black text-white hover:bg-orange-600">
                Search
              </button>
            </label>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-500">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-orange-600">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-slate-900">Products</span>
        </nav>
        {categoryGroups.length > 0 ? (
          <div className="mb-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-black uppercase text-slate-500">Live database categories</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {categoryGroups.map((group) => (
                <Link key={group.name} href={`/products?category=${encodeURIComponent(group.name)}`} className="rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-700">
                  {group.name}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        <ProductFilters
          products={products}
          categories={filterCategories}
          brands={brands}
          initialQuery={q ?? ""}
          initialCategory={category ?? "All"}
        />
      </section>
    </div>
  );
}
