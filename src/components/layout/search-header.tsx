"use client";

import Link from "next/link";
import { MessageCircle, PackageCheck, Search, ShoppingCart, UserRound } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { SearchSubmitButton } from "@/components/forms/search-submit-button";
import type { NavigationCategory } from "@/lib/catalog";
import { whatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

export function SearchHeader({
  categories,
  brands,
}: {
  categories: NavigationCategory[];
  brands: string[];
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const itemCount = useSyncExternalStore(
    useCartStore.subscribe,
    () => useCartStore.getState().itemCount(),
    () => 0,
  );

  const visibleGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [
        {
          label: "Popular searches",
          items: ["Printers", "Photocopiers", "Toners", "Kyocera", "HP", "UPS"].map((item) => ({
            label: item,
            href: `/products?q=${encodeURIComponent(item)}`,
          })),
        },
        {
          label: "Categories",
          items: categories.slice(0, 8).map((category) => ({
            label: `${category.name} (${category.productCount})`,
            href: `/products?category=${encodeURIComponent(category.slug)}`,
          })),
        },
        {
          label: "Brands",
          items: brands.map((brand) => ({
            label: brand,
            href: `/products?brand=${encodeURIComponent(brand)}`,
          })),
        },
      ];
    }

    const groups = [
      {
        label: "Categories",
        items: categories.flatMap((category) => [
          {
            label: `${category.name} (${category.productCount})`,
            href: `/products?category=${encodeURIComponent(category.slug)}`,
          },
          ...category.children.slice(0, 3).map((child) => ({
            label: `${child.name} (${child.productCount})`,
            href: `/products?category=${encodeURIComponent(child.slug)}`,
          })),
        ]),
      },
      {
        label: "Brands",
        items: brands.map((brand) => ({ label: brand, href: `/products?brand=${encodeURIComponent(brand)}` })),
      },
      {
        label: "Search",
        items: [{ label: `Search "${query.trim()}"`, href: `/products?q=${encodeURIComponent(query.trim())}` }],
      },
    ];

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.label.toLowerCase().includes(normalizedQuery)),
      }))
      .filter((group) => group.items.length > 0);
  }, [brands, categories, query]);

  return (
    <>
      <form action="/products" className="relative hidden min-w-0 flex-1 lg:block">
        <label className="relative block">
          <span className="sr-only">Search products</span>
          <input
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 120)}
            placeholder="Search printers, laptops, toners, office equipment..."
            className="h-12 w-full rounded-md border border-slate-300 bg-white pl-12 pr-28 text-sm font-semibold text-slate-950 shadow-sm placeholder:text-slate-500 focus:border-orange-400"
          />
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <SearchSubmitButton className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-md bg-slate-950 px-5 text-white hover:bg-orange-600" />
        </label>

        <div
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/12 transition duration-150",
            focused ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0",
          )}
        >
          <div className="grid gap-0 divide-y divide-slate-100 p-2">
            {visibleGroups.length > 0 ? (
              visibleGroups.map((group) => (
                <section key={group.label} className="p-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{group.label}</p>
                  <div className="mt-2 grid gap-1">
                    {group.items.map((item) => (
                      <Link key={`${group.label}-${item.label}`} href={item.href} className="rounded-md px-2 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <p className="p-4 text-sm font-semibold text-slate-500">Press Search to view matching catalogue results.</p>
            )}
          </div>
        </div>
      </form>

      <div className="flex items-center gap-1 sm:gap-2">
        <Link href="/account" className="hidden min-h-11 items-center gap-2 rounded-md px-3 text-sm font-black text-slate-700 hover:bg-slate-100 lg:inline-flex">
          <UserRound className="h-4 w-4 text-slate-500" />
          Account
        </Link>
        <Link href="/orders" className="hidden min-h-11 items-center gap-2 rounded-md px-3 text-sm font-black text-slate-700 hover:bg-slate-100 md:inline-flex">
          <PackageCheck className="h-4 w-4 text-slate-500" />
          Orders
        </Link>
        <Link href="/cart" className="relative inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-black text-slate-700 hover:bg-slate-100" aria-label="Cart">
          <ShoppingCart className="h-5 w-5 text-slate-600" />
          <span className="hidden sm:inline">Cart</span>
          {itemCount > 0 ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-xs font-black text-white">{itemCount}</span> : null}
        </Link>
        <Link href={whatsappUrl("Hello CETER TECHNOLOGIES, I need help with a technology purchase.")} className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-black text-emerald-700 hover:bg-emerald-50" target="_blank" rel="noreferrer">
          <MessageCircle className="h-5 w-5" />
          <span className="hidden xl:inline">WhatsApp</span>
        </Link>
      </div>

      <form action="/products" className="order-last w-full lg:hidden">
        <label className="relative block">
          <span className="sr-only">Search products</span>
          <input name="q" placeholder="Search printers, laptops, toners..." className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm font-semibold text-slate-950 placeholder:text-slate-500" />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <SearchSubmitButton className="absolute right-1 top-1/2 h-9 -translate-y-1/2 rounded-md bg-slate-950 px-3 text-white" compact />
        </label>
      </form>
    </>
  );
}
