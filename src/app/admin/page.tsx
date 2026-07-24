import type { Metadata } from "next";
import Link from "next/link";
import { BadgePercent, ClipboardList, FileSpreadsheet, PackagePlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOwnerSuperAdmin } from "@/lib/rbac";
import { formatDate } from "./utils";

export const metadata: Metadata = {
  title: "Owner Dashboard",
  description: "Single-owner operational dashboard for CETER administration.",
};

type Props = {
  searchParams: Promise<{ notice?: string }>;
};

export default async function OwnerDashboard({ searchParams }: Props) {
  await requireOwnerSuperAdmin();
  const { notice } = await searchParams;

  const [
    totalProducts,
    draftProducts,
    publishedProducts,
    archivedProducts,
    totalCategories,
    totalBrands,
    pendingRequests,
    recentImports,
    recentActivity,
  ] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } as never }),
    prisma.product.count({ where: { status: "DRAFT", deletedAt: null } as never }),
    prisma.product.count({ where: { status: "PUBLISHED", deletedAt: null } as never }),
    prisma.product.count({ where: { status: "ARCHIVED", deletedAt: null } as never }),
    prisma.category.count(),
    prisma.brand.count(),
    prisma.quoteRequest.count({ where: { status: { in: ["NEW", "CONTACTED"] }, deletedAt: null } as never }),
    prisma.importHistory.findMany({ include: { admin: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  return (
    <section className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-wide text-orange-600">Dashboard</p>
        <h1 className="text-2xl font-black text-slate-950">Owner operations</h1>
        <p className="mt-1 text-sm text-slate-500">Catalogue health, customer demand, imports, uploads, and recent administrator activity.</p>
      </div>

      {notice === "single-owner-mode" ? (
        <div className="mb-5 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-900" role="status">
          Single-owner mode is enabled. Users, roles, permissions, invitations, and delegation controls are not exposed in admin.
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-3">
        <ActionLink href="/admin/import" icon={<FileSpreadsheet className="h-4 w-4" />} label="Import products" primary />
        <ActionLink href="/admin/products?edit=new" icon={<PackagePlus className="h-4 w-4" />} label="Add product" primary />
        <ActionLink href="/admin/products" icon={<BadgePercent className="h-4 w-4" />} label="Update pricing" />
        <ActionLink href="/admin/orders" icon={<ClipboardList className="h-4 w-4" />} label="Open orders" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total products" value={totalProducts} href="/admin/products" />
        <Metric label="Draft products" value={draftProducts} href="/admin/products?status=DRAFT" />
        <Metric label="Published products" value={publishedProducts} href="/admin/products?status=PUBLISHED" />
        <Metric label="Archived products" value={archivedProducts} href="/admin/products?status=ARCHIVED" tone="warning" />
        <Metric label="Categories" value={totalCategories} href="/admin/categories" />
        <Metric label="Brands" value={totalBrands} href="/admin/brands" />
        <Metric label="Pending customer requests" value={pendingRequests} href="/admin/orders" tone="warning" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">Recent imports</h2>
              <p className="mt-1 text-sm text-slate-500">Latest import batches and outcomes.</p>
            </div>
            <Link href="/admin/import" className="text-sm font-black text-orange-700 hover:text-orange-800">Open import</Link>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {recentImports.map((item) => (
              <div key={item.id} className="grid gap-1 py-3 text-sm sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-black text-slate-950">{item.fileName}</p>
                  <p className="text-slate-500">{item.type} by {item.admin.name}</p>
                </div>
                <p className="font-bold text-slate-700">{item.importedRecords} imported, {item.failedRecords} failed</p>
              </div>
            ))}
            {recentImports.length === 0 ? <p className="py-6 text-sm text-slate-500">No imports yet. Start with Catalogue Import.</p> : null}
          </div>
        </section>

      </div>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">Recent activity</h2>
            <p className="mt-1 text-sm text-slate-500">Read-only audit trail of recent owner actions.</p>
          </div>
          <Link href="/admin/activity" className="text-sm font-black text-orange-700 hover:text-orange-800">View all</Link>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {recentActivity.map((item) => (
            <div key={item.id} className="grid gap-1 py-3 text-sm md:grid-cols-[1fr_160px]">
              <p className="font-bold text-slate-800">{item.actorName}: {item.action} {item.entityType ? `(${item.entityType})` : ""}</p>
              <p className="text-slate-500 md:text-right">{formatDate(item.createdAt)}</p>
            </div>
          ))}
          {recentActivity.length === 0 ? <p className="py-6 text-sm text-slate-500">No admin activity has been recorded yet.</p> : null}
        </div>
      </section>
    </section>
  );
}

function ActionLink({ href, icon, label, primary }: { href: string; icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-black ${
        primary ? "bg-orange-500 text-white shadow-sm hover:bg-orange-600" : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function Metric({ label, value, href, tone = "default" }: { label: string; value: number; href: string; tone?: "default" | "warning" | "danger" }) {
  const toneClass = tone === "danger" ? "border-red-200 bg-red-50" : tone === "warning" ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-white";
  return (
    <Link href={href} className={`rounded-md border p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value.toLocaleString("en-KE")}</p>
    </Link>
  );
}
