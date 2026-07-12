"use client";

import Link from "next/link";
import { Menu, Search, ShoppingCart, UserRound, X } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { marketplaceDepartments } from "@/lib/marketplace";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

const utilityLinks = [
  { href: "/orders", label: "Orders" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Support" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const itemCount = useSyncExternalStore(
    useCartStore.subscribe,
    () => useCartStore.getState().itemCount(),
    () => 0,
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="CETER Technology home">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-orange-500 text-sm font-black text-white">
              CT
            </span>
            <span className="leading-tight">
              <span className="block text-base font-black tracking-wide">CETER TECHNOLOGY</span>
              <span className="block text-xs font-semibold text-slate-300">Technology marketplace</span>
            </span>
          </Link>

          <form action="/products" className="hidden min-w-0 flex-1 lg:block">
            <label className="relative block">
              <span className="sr-only">Search products</span>
              <input
                name="q"
                placeholder="Search printers, toner number, laptop brand, SKU, networking..."
                className="h-11 w-full rounded-md border border-white/10 bg-white px-12 text-sm font-semibold text-slate-950 placeholder:text-slate-500"
              />
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <button className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-md bg-orange-500 px-4 text-sm font-black text-white hover:bg-orange-600">
                Search
              </button>
            </label>
          </form>

          <div className="flex items-center gap-2">
            <Link
              href="/checkout"
              className="hidden min-h-11 items-center gap-2 rounded-md px-3 text-sm font-bold text-slate-100 hover:bg-white/10 md:inline-flex"
            >
              <UserRound className="h-4 w-4 text-orange-300" />
              Account
            </Link>
            <Link
              href="/cart"
              className="relative inline-flex h-11 min-w-11 items-center justify-center rounded-md border border-white/10 px-3 text-slate-100 hover:bg-white/10"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="ml-2 hidden text-sm font-bold sm:inline">Cart</span>
              {itemCount > 0 ? (
                <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-xs font-bold text-white">
                  {itemCount}
                </span>
              ) : null}
            </Link>
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/10 lg:hidden"
              onClick={() => setOpen((value) => !value)}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <button
            className="hidden min-h-10 items-center gap-2 rounded-md bg-slate-100 px-3 text-sm font-black text-slate-950 hover:bg-orange-50 hover:text-orange-700 lg:inline-flex"
            onClick={() => setMegaOpen((value) => !value)}
          >
            <Menu className="h-4 w-4" />
            All departments
          </button>
          <div className="hidden min-w-0 flex-1 lg:block" />
          <div className="hidden items-center gap-1 lg:flex">
            {utilityLinks.map((link) => (
              <Link key={`utility-${link.href}`} href={link.href} className="rounded-md px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100">
                {link.label}
              </Link>
            ))}
          </div>
          <form action="/products" className="w-full lg:hidden">
            <label className="relative block">
              <span className="sr-only">Search products</span>
              <input name="q" placeholder="Search CETER catalogue" className="h-11 w-full rounded-md border border-slate-300 pl-10 pr-3 text-sm" />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </label>
          </form>
        </div>
      </div>

      <div className={cn("border-b border-slate-200 bg-white shadow-lg lg:absolute lg:inset-x-0", megaOpen ? "block" : "hidden")}>
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-4 lg:px-8">
          {marketplaceDepartments.map((department) => {
            const Icon = department.icon;

            return (
              <section key={department.name} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <Link href={department.href} className="flex items-center gap-2 font-black text-slate-950 hover:text-orange-700" onClick={() => setMegaOpen(false)}>
                  <Icon className="h-5 w-5 text-orange-500" />
                  {department.name}
                </Link>
                <div className="mt-3 grid gap-1">
                  {department.items.map((item) => (
                    <Link
                      key={item}
                      href={`/products?q=${encodeURIComponent(item)}`}
                      className="rounded px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-white hover:text-orange-700"
                      onClick={() => setMegaOpen(false)}
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className={cn("border-t border-slate-200 bg-white px-4 py-4 lg:hidden", open ? "block" : "hidden")}>
        <nav className="mx-auto grid max-w-7xl gap-2">
          {[...marketplaceDepartments, ...utilityLinks].map((link) => (
            <Link
              key={`${"label" in link ? "utility" : "department"}-${link.href}-${"label" in link ? link.label : link.name}`}
              href={link.href}
              className="rounded-md px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              onClick={() => setOpen(false)}
            >
              {"label" in link ? link.label : link.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
