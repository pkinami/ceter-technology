"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import type { OwnerNavIcon, OwnerNavItem } from "./owner-admin-nav";
import {
  Boxes,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  Images,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Tags,
  Users,
  X,
} from "lucide-react";

const ownerNavIcons = {
  boxes: Boxes,
  "clipboard-list": ClipboardList,
  "file-spreadsheet": FileSpreadsheet,
  images: Images,
  "layout-dashboard": LayoutDashboard,
  settings: Settings,
  tags: Tags,
  users: Users,
} satisfies Record<OwnerNavIcon, ComponentType<{ className?: string }>>;

export function AdminShell({
  adminName,
  navItems,
  signOutAction,
  children,
}: {
  adminName: string;
  navItems: OwnerNavItem[];
  signOutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const activeItem = useMemo(() => bestNavMatch(navItems, pathname), [navItems, pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if (event.key === "Escape") {
        setDrawerOpen(false);
        setPaletteOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function closeNavigation() {
    setDrawerOpen(false);
    setPaletteOpen(false);
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-md border border-slate-300 text-slate-700 lg:hidden"
            aria-label="Open admin navigation"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-wide text-orange-600">CETER owner admin</p>
            <div className="mt-1 flex flex-wrap items-center gap-1 text-sm text-slate-500">
              <Link href="/admin" className="font-bold text-slate-700 hover:text-orange-700">Admin</Link>
              {activeItem?.href !== "/admin" ? (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <span className="font-bold text-slate-950">{activeItem?.label ?? "Workspace"}</span>
                </>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden min-h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 md:inline-flex"
          >
            <Search className="h-4 w-4" />
            Search admin
            <span className="rounded border border-slate-200 px-1.5 py-0.5 text-[11px] text-slate-500">Ctrl K</span>
          </button>
          <form action={signOutAction}>
            <button className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200 bg-white px-4 py-5 lg:block">
          <p className="px-3 text-xs font-black uppercase tracking-wide text-slate-500">Signed in as {adminName}</p>
          <NavList items={navItems} pathname={pathname} onNavigate={closeNavigation} />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button className="absolute inset-0 bg-slate-950/45" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />
          <div className="relative h-full w-[min(22rem,88vw)] overflow-y-auto bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-orange-600">CETER admin</p>
                <p className="text-sm font-bold text-slate-600">{adminName}</p>
              </div>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-md border border-slate-300" aria-label="Close navigation" onClick={() => setDrawerOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList items={navItems} pathname={pathname} onNavigate={closeNavigation} />
          </div>
        </div>
      ) : null}

      {paletteOpen ? <CommandPalette items={navItems} onClose={() => setPaletteOpen(false)} onNavigate={closeNavigation} /> : null}
    </div>
  );
}

function NavList({ items, pathname, onNavigate }: { items: OwnerNavItem[]; pathname: string; onNavigate: () => void }) {
  return (
    <nav className="mt-4 grid gap-1" aria-label="Owner administration">
      {items.map((item) => {
        const Icon = ownerNavIcons[item.icon];
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-12 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm ${
              active ? "bg-slate-950 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            <Icon className={`h-5 w-5 shrink-0 ${active ? "text-orange-300" : "text-orange-500"}`} />
            <span className="min-w-0">
              <span className="block font-black">{item.label}</span>
              <span className={`block truncate text-xs ${active ? "text-slate-200" : "text-slate-500"}`}>{item.description}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function CommandPalette({ items, onClose, onNavigate }: { items: OwnerNavItem[]; onClose: () => void; onNavigate: () => void }) {
  const [query, setQuery] = useState("");
  const commands = [
    ...items,
    { href: "/admin/products?edit=new", label: "Add product", description: "Create a draft product", icon: "boxes" as const },
    { href: "/admin/import", label: "Start import", description: "Open catalogue import", icon: "file-spreadsheet" as const },
    { href: "/admin/media", label: "Review images", description: "Manage product images", icon: "images" as const },
  ];
  const filtered = commands.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-slate-950/45 px-4 pt-20" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Find pages, products, or actions"
            className="h-14 min-w-0 flex-1 border-0 text-sm shadow-none focus:shadow-none"
          />
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100">Esc</button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filtered.map((item) => {
            const Icon = ownerNavIcons[item.icon];
            return (
              <Link key={`${item.href}-${item.label}`} href={item.href} onClick={onNavigate} className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left hover:bg-slate-100">
                <Icon className="h-5 w-5 text-orange-500" />
                <span>
                  <span className="block text-sm font-black text-slate-950">{item.label}</span>
                  <span className="block text-xs font-semibold text-slate-500">{item.description}</span>
                </span>
              </Link>
            );
          })}
          {filtered.length === 0 ? <p className="px-3 py-8 text-center text-sm font-semibold text-slate-500">No matching admin action.</p> : null}
        </div>
      </div>
    </div>
  );
}

function bestNavMatch(items: OwnerNavItem[], pathname: string) {
  return items
    .filter((item) => isActivePath(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
