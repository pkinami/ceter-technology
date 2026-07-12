import Link from "next/link";
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LayoutTemplate,
  Tags,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { signOutAdmin } from "@/app/(admin-auth)/admin/login/actions";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: null },
  { href: "/admin/products", label: "Products", icon: Boxes, permission: "products.view" },
  { href: "/admin/categories", label: "Categories", icon: Tags, permission: "categories.manage" },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, permission: "orders.view" },
  { href: "/admin/customers", label: "Customers", icon: Users, permission: "customers.view" },
  { href: "/admin/homepage", label: "Homepage", icon: LayoutTemplate, permission: "marketing.manage" },
  { href: "/admin/users", label: "Users", icon: Users, permission: "users.view" },
];

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50">
      <section className="border-b border-slate-800 bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-orange-300">
              CETER Technology Admin
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-normal">
              Operations dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Signed in as {admin.name}. Admin routes are isolated from customer
              shopping pages.
            </p>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {adminLinks.filter((item) => !item.permission || admin.permissions.has(item.permission)).map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-slate-100 hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-sm"
                >
                  <Icon className="h-4 w-4 text-orange-300" />
                  {item.label}
                </Link>
              );
            })}
            <form action={signOutAdmin}>
              <button className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-slate-100 hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-sm">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </section>
      {children}
    </div>
  );
}
