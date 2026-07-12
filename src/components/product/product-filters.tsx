"use client";

import { BadgeCheck, Printer, Search, SlidersHorizontal, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

type SortMode = "newest" | "price-low" | "price-high";

export function ProductFilters({
  products,
  categories,
  brands,
  initialQuery = "",
  initialCategory = "All",
}: {
  products: Product[];
  categories: string[];
  brands: string[];
  initialQuery?: string;
  initialCategory?: string;
}) {
  const highestPrice = Math.max(
    1000,
    ...products.map((product) => product.discountPrice ?? product.price),
  );
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(categories.includes(initialCategory) ? initialCategory : "All");
  const [brand, setBrand] = useState("All");
  const [stock, setStock] = useState("All");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(Math.ceil(highestPrice / 1000) * 1000);
  const [sort, setSort] = useState<SortMode>("newest");
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const normalizedQuery = deferredQuery.toLowerCase().trim();

    return products
      .filter((product) => {
        const salePrice = product.discountPrice ?? product.price;
        const specText = Object.entries(product.specs)
          .map(([key, value]) => `${key} ${value}`)
          .join(" ")
          .toLowerCase();
        const matchesQuery =
          !normalizedQuery ||
          product.name.toLowerCase().includes(normalizedQuery) ||
          product.brand.toLowerCase().includes(normalizedQuery) ||
          product.category.toLowerCase().includes(normalizedQuery) ||
          product.subcategory.toLowerCase().includes(normalizedQuery) ||
          product.slug.toLowerCase().includes(normalizedQuery) ||
          product.description.toLowerCase().includes(normalizedQuery) ||
          specText.includes(normalizedQuery);
        const matchesCategory =
          category === "All" ||
          product.category === category ||
          product.subcategory === category;
        const matchesBrand = brand === "All" || product.brand === brand;
        const matchesStock =
          stock === "All" ||
          (stock === "available" && product.availability !== "Out of stock") ||
          (stock === "out" && product.availability === "Out of stock");
        const matchesPrice = salePrice >= minPrice && salePrice <= maxPrice;

        return matchesQuery && matchesCategory && matchesBrand && matchesStock && matchesPrice;
      })
      .sort((a, b) => {
        const aPrice = a.discountPrice ?? a.price;
        const bPrice = b.discountPrice ?? b.price;

        if (sort === "price-low") return aPrice - bPrice;
        if (sort === "price-high") return bPrice - aPrice;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [brand, category, deferredQuery, maxPrice, minPrice, products, sort, stock]);

  const suggestions = useMemo(() => {
    const normalizedQuery = deferredQuery.toLowerCase().trim();

    if (!normalizedQuery) {
      return [];
    }

    return products
      .filter((product) => {
        const haystack = `${product.name} ${product.brand} ${product.category} ${product.subcategory} ${product.slug} ${Object.values(product.specs).join(" ")}`.toLowerCase();

        return haystack.includes(normalizedQuery);
      })
      .slice(0, 5);
  }, [deferredQuery, products]);

  const quickFinders = [
    "HP toner",
    "Canon cartridge",
    "Epson ink bottle",
    "Laser printer",
    "Multifunction printer",
    "UPS",
  ];

  function resetFilters() {
    setQuery("");
    setCategory("All");
    setBrand("All");
    setStock("All");
    setMinPrice(0);
    setMaxPrice(Math.ceil(highestPrice / 1000) * 1000);
    setSort("newest");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-950">
          <SlidersHorizontal className="h-5 w-5 text-orange-500" />
          Refine products
        </div>
        <div className="mt-5 grid gap-5">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Intelligent search
            <span className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3 outline-none focus:border-orange-500"
                placeholder="Printer, toner, UPS..."
              />
            </span>
          </label>
          {suggestions.length > 0 ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-black uppercase text-slate-500">Instant suggestions</p>
              <div className="mt-2 grid gap-2">
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setQuery(product.name)}
                    className="text-left text-sm font-semibold text-slate-700 hover:text-orange-700"
                  >
                    {product.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="rounded-md border border-orange-200 bg-orange-50 p-3">
            <div className="flex items-center gap-2 text-sm font-black text-orange-900">
              <Printer className="h-4 w-4" />
              Printer consumable finder
            </div>
            <p className="mt-2 text-xs leading-5 text-orange-900/80">
              Search by printer brand, model, toner number, cartridge number, or ink bottle code.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickFinders.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQuery(item)}
                  className="rounded-md bg-white px-2 py-1 text-xs font-bold text-orange-800 hover:bg-orange-100"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-11 rounded-md border border-slate-200 px-3 outline-none focus:border-orange-500"
            >
              <option>All</option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Brand
            <select
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              className="h-11 rounded-md border border-slate-200 px-3 outline-none focus:border-orange-500"
            >
              <option>All</option>
              {brands.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Availability
            <select
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              className="h-11 rounded-md border border-slate-200 px-3 outline-none focus:border-orange-500"
            >
              <option value="All">All stock statuses</option>
              <option value="available">Available</option>
              <option value="out">Out of stock</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Price range
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                step="500"
                value={minPrice}
                onChange={(event) => setMinPrice(Number(event.target.value))}
                className="h-11 rounded-md border border-slate-200 px-3 outline-none focus:border-orange-500"
                aria-label="Minimum price"
              />
              <input
                type="number"
                min="0"
                step="500"
                value={maxPrice}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
                className="h-11 rounded-md border border-slate-200 px-3 outline-none focus:border-orange-500"
                aria-label="Maximum price"
              />
            </div>
            <input
              type="range"
              min="0"
              max={Math.ceil(highestPrice / 1000) * 1000}
              step="1000"
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
              className="accent-orange-500"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Sort by
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortMode)}
              className="h-11 rounded-md border border-slate-200 px-3 outline-none focus:border-orange-500"
            >
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="newest">Newest products</option>
            </select>
          </label>
          <button type="button" onClick={resetFilters} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-100">
            <X className="h-4 w-4" />
            Clear filters
          </button>
        </div>
      </aside>
      <div>
        <div className="mb-5 flex flex-col justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
          <p className="text-sm font-semibold text-slate-600">
            Showing {filtered.length} of {products.length} products
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
            <span className="rounded-md bg-slate-100 px-2 py-1">{category === "All" ? "All categories" : category}</span>
            <span className="rounded-md bg-slate-100 px-2 py-1">{brand === "All" ? "All brands" : brand}</span>
            <span className="rounded-md bg-slate-100 px-2 py-1">
              {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
              <BadgeCheck className="h-3.5 w-3.5" />
              Genuine supply
            </span>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            No products match the selected filters.
          </div>
        ) : null}
      </div>
    </div>
  );
}
