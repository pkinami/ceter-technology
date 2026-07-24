"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { NavigationCategory } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type MobileMenuProps = {
  id: string;
  open: boolean;
  onNavigate: () => void;
  categories: NavigationCategory[];
};

export function MobileMenu({ id, open, onNavigate, categories }: MobileMenuProps) {
  const [openDepartmentId, setOpenDepartmentId] = useState<string | null>(categories[0]?.slug ?? null);

  return (
    <div id={id} className={cn("overflow-hidden border-t border-slate-200 bg-white transition-[max-height,opacity] duration-200 lg:hidden", open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0")}>
      <nav className="max-h-[80vh] overflow-y-auto px-4 py-3" aria-label="Mobile departments">
        <Link href="/products" onClick={onNavigate} className="mb-2 flex min-h-12 items-center justify-between rounded-md bg-slate-950 px-4 text-sm font-black text-white">
          Departments
          <ChevronRight className="h-4 w-4" />
        </Link>
        <div className="grid gap-1">
          {categories.map((department) => {
            const expanded = openDepartmentId === department.slug;

            return (
              <section key={department.id} className="rounded-md border border-slate-200">
                <button
                  type="button"
                  className="flex min-h-12 w-full items-center justify-between px-4 text-left text-sm font-black text-slate-950"
                  onClick={() => setOpenDepartmentId((value) => (value === department.slug ? null : department.slug))}
                  aria-expanded={expanded}
                >
                  <span>{department.name}</span>
                  <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform", expanded ? "rotate-180" : "")} />
                </button>
                <div className={cn("grid overflow-hidden transition-[grid-template-rows] duration-200", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="min-h-0">
                    <div className="grid gap-1 border-t border-slate-200 bg-slate-50 p-2">
                      <Link href={`/products?category=${encodeURIComponent(department.slug)}`} onClick={onNavigate} className="flex min-h-11 items-center justify-between rounded-md bg-white px-3 text-sm font-black text-slate-950">
                        View all {department.name}
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </Link>
                      {department.children.map((category) => (
                        <Link key={category.id} href={`/products?category=${encodeURIComponent(category.slug)}`} onClick={onNavigate} className="flex min-h-11 items-center justify-between rounded-md px-3 text-sm font-bold text-slate-700 hover:bg-white">
                          <span>{category.name}</span>
                          <span className="ml-auto mr-2 text-xs text-slate-400">{category.productCount}</span>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
