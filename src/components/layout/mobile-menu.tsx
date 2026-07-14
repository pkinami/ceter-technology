"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { marketplaceNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type MobileMenuProps = {
  id: string;
  open: boolean;
  onNavigate: () => void;
};

export function MobileMenu({ id, open, onNavigate }: MobileMenuProps) {
  const [openDepartmentId, setOpenDepartmentId] = useState<string | null>("printers");
  const [openCategoryKey, setOpenCategoryKey] = useState<string | null>("printers:Laser Printers");

  return (
    <div id={id} className={cn("overflow-hidden border-t border-slate-200 bg-white transition-[max-height,opacity] duration-200 lg:hidden", open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0")}>
      <nav className="max-h-[80vh] overflow-y-auto px-4 py-3" aria-label="Mobile departments">
        <Link href="/products" onClick={onNavigate} className="mb-2 flex min-h-12 items-center justify-between rounded-md bg-slate-950 px-4 text-sm font-black text-white">
          Departments
          <ChevronRight className="h-4 w-4" />
        </Link>
        <div className="grid gap-1">
          {marketplaceNavigation.map((department) => {
            const expanded = openDepartmentId === department.id;

            return (
              <section key={department.id} className="rounded-md border border-slate-200">
                <button
                  type="button"
                  className="flex min-h-12 w-full items-center justify-between px-4 text-left text-sm font-black text-slate-950"
                  onClick={() => setOpenDepartmentId((value) => (value === department.id ? null : department.id))}
                  aria-expanded={expanded}
                >
                  {department.label}
                  <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform", expanded ? "rotate-180" : "")} />
                </button>
                <div className={cn("grid overflow-hidden transition-[grid-template-rows] duration-200", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="min-h-0">
                    <div className="grid gap-1 border-t border-slate-200 bg-slate-50 p-2">
                      {department.categories.map((category) => {
                        const categoryKey = `${department.id}:${category.label}`;
                        const categoryExpanded = openCategoryKey === categoryKey;

                        if (!category.children?.length) {
                          return (
                            <Link key={category.label} href={category.href} onClick={onNavigate} className="flex min-h-11 items-center justify-between rounded-md px-3 text-sm font-bold text-slate-700 hover:bg-white">
                              {category.label}
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            </Link>
                          );
                        }

                        return (
                          <div key={category.label} className="overflow-hidden rounded-md bg-white">
                            <button
                              type="button"
                              className="flex min-h-11 w-full items-center justify-between px-3 text-left text-sm font-bold text-slate-700"
                              onClick={() => setOpenCategoryKey((value) => (value === categoryKey ? null : categoryKey))}
                              aria-expanded={categoryExpanded}
                            >
                              {category.label}
                              <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", categoryExpanded ? "rotate-180" : "")} />
                            </button>
                            <div className={cn("grid overflow-hidden transition-[grid-template-rows] duration-200", categoryExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                              <div className="min-h-0">
                                <div className="grid gap-1 border-t border-slate-100 bg-slate-50 px-3 py-2">
                                  <Link href={category.href} onClick={onNavigate} className="rounded-md py-2 text-sm font-black text-slate-950">
                                    View all {category.label}
                                  </Link>
                                  {category.children.map((child) => (
                                    <Link key={child.label} href={child.href} onClick={onNavigate} className="rounded-md py-2 pl-3 text-sm font-semibold text-slate-600 hover:text-orange-700">
                                      {child.label}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
