import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import {
  BadgePercent,
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  FileSpreadsheet,
  LayoutDashboard,
  Megaphone,
  PackageSearch,
  Settings,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { signOutAdmin } from "@/app/(admin-auth)/admin/login/actions";

const navGroups: Array<{
  label: string;
  links: Array<{ href: string; label: string; icon: LucideIcon; permission: string | null }>;
}> = [
  {
    label: "Operations",
    links: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: null },
      { href: "/admin/orders", label: "Orders", icon: ClipboardList, permission: "orders.view" },
      { href: "/admin/customers", label: "Customers", icon: Users, permission: "customers.view" },
    ],
  },
  {
    label: "Catalogue",
    links: [
      { href: "/admin/products", label: "Products", icon: Boxes, permission: "products.view" },
      { href: "/admin/categories", label: "Categories", icon: Tags, permission: "categories.manage" },
      { href: "/admin/brands", label: "Brands", icon: Building2, permission: "marketing.manage" },
      { href: "/admin/suppliers", label: "Suppliers", icon: PackageSearch, permission: "products.edit" },
    ],
  },
  {
    label: "Commerce",
    links: [
      { href: "/admin/inventory", label: "Inventory", icon: PackageSearch, permission: "products.view" },
      { href: "/admin/pricing", label: "Pricing", icon: BadgePercent, permission: "products.edit" },
      { href: "/admin/marketing", label: "Marketing", icon: Megaphone, permission: "marketing.manage" },
      { href: "/admin/import", label: "Imports", icon: FileSpreadsheet, permission: "products.bulk" },
    ],
  },
  {
    label: "Management",
    links: [
      { href: "/admin/reports", label: "Reports", icon: BarChart3, permission: "reports.view" },
      { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings.manage" },
      { href: "/admin/users", label: "Users & Roles", icon: ShieldCheck, permission: "users.view" },
    ],
  },
];

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const admin = await requireAdmin();

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-orange-600">CETER Technologies ERP</p>
              <h1 className="text-2xl font-black tracking-normal text-slate-950">Marketplace administration</h1>
              <p className="mt-1 text-sm text-slate-500">Signed in as {admin.name}. Workflows are grouped by business responsibility.</p>
            </div>
            <form action={signOutAdmin}>
              <button className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50">
                Sign out
              </button>
            </form>
          </div>

          <nav className="grid gap-3 xl:grid-cols-4">
            {navGroups.map((group) => {
              const links = group.links.filter((item) => !item.permission || admin.permissions.has(item.permission));
              if (links.length === 0) return null;
              return (
                <div key={group.label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-500">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {links.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.href} href={item.href} className="inline-flex min-h-9 items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm hover:-translate-y-0.5 hover:text-orange-700 hover:shadow">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
