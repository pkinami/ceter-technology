"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { categories } from "@/data/products";
import type { Product } from "@/types";

type SortMode = "featured" | "price-low" | "price-high" | "name";

export function ProductFilters({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState(70000);
  const [sort, setSort] = useState<SortMode>("featured");

  const filtered = useMemo(() => {
    return products
      .filter((product) => {
        const matchesQuery =
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.description.toLowerCase().includes(query.toLowerCase()) ||
          product.subcategory.toLowerCase().includes(query.toLowerCase());
        const matchesCategory =
          category === "All" || product.category === category;
        const matchesPrice = product.price <= maxPrice;

        return matchesQuery && matchesCategory && matchesPrice;
      })
      .sort((a, b) => {
        if (sort === "price-low") return a.price - b.price;
        if (sort === "price-high") return b.price - a.price;
        if (sort === "name") return a.name.localeCompare(b.name);
        return Number(b.featured) - Number(a.featured);
      });
  }, [category, maxPrice, products, query, sort]);

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-950">
          <SlidersHorizontal className="h-5 w-5 text-orange-500" />
          Filters
        </div>
        <div className="mt-5 grid gap-5">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Search products
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
            Max price: KES {maxPrice.toLocaleString()}
            <input
              type="range"
              min="1000"
              max="70000"
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
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
      </aside>
      <div>
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-slate-600">
            Showing {filtered.length} of {products.length} products
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
