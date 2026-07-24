"use client";

import dynamic from "next/dynamic";
import { ChevronDown, Menu } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { NavigationCategory } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/components/layout/mobile-menu";

const LazyMegaMenu = dynamic(() => import("@/components/layout/mega-menu").then((module) => module.MegaMenu), {
  loading: () => <div className="mx-auto h-72 max-w-7xl rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/10" />,
});

export function DepartmentMenu({ categories }: { categories: NavigationCategory[] }) {
  const menuId = useId();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [activeDepartmentId, setActiveDepartmentId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMenu = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setActiveDepartmentId(null);
  }, []);

  const openMenu = (departmentId: string) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setActiveDepartmentId(departmentId);
  };

  const scheduleClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }
    closeTimer.current = setTimeout(() => setActiveDepartmentId(null), 140);
  };

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);

      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    };
  }, [closeMenu]);

  return (
    <div
      ref={menuRef}
      className="relative border-t border-slate-200 bg-white"
      onMouseEnter={() => {
        if (closeTimer.current) {
          clearTimeout(closeTimer.current);
          closeTimer.current = null;
        }
      }}
      onMouseLeave={scheduleClose}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          scheduleClose();
        }
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="inline-flex h-12 items-center gap-2 rounded-md px-1 text-sm font-black text-slate-950 lg:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-expanded={mobileOpen}
          aria-controls={`${menuId}-mobile`}
        >
          <Menu className="h-5 w-5" />
          Departments
          <ChevronDown className={cn("h-4 w-4 transition-transform", mobileOpen ? "rotate-180" : "")} />
        </button>

        <nav className="hidden h-12 items-center gap-1 lg:flex" aria-label="Marketplace departments">
          {[{ id: "all", name: "Shop by Departments" }, ...categories.slice(0, 8).map((category) => ({ id: category.slug, name: category.name }))].map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-black text-slate-700 hover:bg-slate-100 hover:text-slate-950 focus:bg-slate-100 focus:text-slate-950",
                activeDepartmentId === item.id && "bg-slate-100 text-slate-950",
              )}
              onMouseEnter={() => openMenu(item.id)}
              onFocus={() => openMenu(item.id)}
              onClick={() => setActiveDepartmentId((value) => (value === item.id ? null : item.id))}
              aria-expanded={activeDepartmentId === item.id}
              aria-controls={`${menuId}-mega`}
            >
              {item.name}
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          ))}
        </nav>
      </div>

      <MobileMenu id={`${menuId}-mobile`} open={mobileOpen} onNavigate={() => setMobileOpen(false)} categories={categories} />

      <div
        id={`${menuId}-mega`}
        className={cn(
          "absolute inset-x-0 top-full z-40 hidden border-t border-slate-100 bg-transparent pt-3 transition duration-150 lg:block",
          activeDepartmentId
            ? "visible pointer-events-auto translate-y-0 opacity-100"
            : "invisible pointer-events-none -translate-y-1 opacity-0",
        )}
        aria-hidden={!activeDepartmentId}
      >
        {activeDepartmentId ? <LazyMegaMenu activeDepartmentId={activeDepartmentId} onNavigate={closeMenu} categories={categories} /> : null}
      </div>
    </div>
  );
}
