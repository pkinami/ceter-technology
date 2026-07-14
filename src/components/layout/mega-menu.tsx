"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Grid3X3, Sparkles } from "lucide-react";
import { marketplaceNavigation, type MarketplaceDepartment } from "@/lib/navigation";

type MegaMenuProps = {
  activeDepartmentId: string;
  onNavigate: () => void;
};

function resolveDepartment(activeDepartmentId: string): MarketplaceDepartment {
  return marketplaceNavigation.find((department) => department.id === activeDepartmentId) ?? marketplaceNavigation[0];
}

export function MegaMenu({ activeDepartmentId, onNavigate }: MegaMenuProps) {
  if (activeDepartmentId === "all") {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/12">
          <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
            <div className="border-b border-slate-200 bg-slate-50 p-6 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-slate-950 text-white">
                  <Grid3X3 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-slate-950">Departments</p>
                  <p className="text-xs font-semibold text-slate-500">Explore CETER marketplace categories</p>
                </div>
              </div>
              <Link href="/products" onClick={onNavigate} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-orange-700">
                View all products
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:p-6">
              {marketplaceNavigation.map((department) => (
                <Link
                  key={department.id}
                  href={department.href}
                  onClick={onNavigate}
                  className="group rounded-md border border-slate-200 bg-white p-4 hover:border-orange-200 hover:bg-orange-50/60 hover:shadow-sm"
                >
                  <span className="flex items-center justify-between gap-3 text-sm font-black text-slate-950">
                    {department.label}
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-orange-600" />
                  </span>
                  <span className="mt-2 line-clamp-2 block text-xs font-semibold leading-5 text-slate-500">
                    {department.categories.map((category) => category.label).slice(0, 4).join(", ")}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const department = resolveDepartment(activeDepartmentId);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/12">
        <div className="grid lg:grid-cols-[280px_280px_1fr]">
          <section className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r">
            <Link href={department.href} onClick={onNavigate} className="group flex items-center justify-between gap-3">
              <span>
                <span className="block text-xs font-black uppercase tracking-[0.18em] text-orange-600">Department</span>
                <span className="mt-2 block text-xl font-black text-slate-950">{department.label}</span>
              </span>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-orange-600" />
            </Link>
            <div className="mt-5 grid gap-1">
              {department.categories.map((category) => (
                <Link
                  key={category.label}
                  href={category.href}
                  onClick={onNavigate}
                  className="group flex min-h-10 items-center justify-between rounded-md px-3 text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                >
                  {category.label}
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-orange-600" />
                </Link>
              ))}
            </div>
          </section>

          <section className="border-b border-slate-200 bg-slate-50 p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Popular categories</p>
            <h3 className="mt-2 text-lg font-black text-slate-950">{department.popularTitle}</h3>
            <div className="mt-5 grid gap-2">
              {department.popular.map((item) => (
                <Link key={item.label} href={item.href} onClick={onNavigate} className="rounded-md bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:text-orange-700 hover:ring-orange-200">
                  {item.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-500" />
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{department.featuredTitle}</p>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {department.featured.map((card) => (
                <Link key={card.label} href={card.href} onClick={onNavigate} className="group rounded-md border border-slate-200 bg-white p-4 hover:border-orange-200 hover:bg-orange-50/60 hover:shadow-md">
                  <span className="block text-sm font-black text-slate-950 group-hover:text-orange-700">{card.label}</span>
                  <span className="mt-2 block text-xs font-semibold leading-5 text-slate-500">{card.description}</span>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-slate-950">
                    Explore
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
