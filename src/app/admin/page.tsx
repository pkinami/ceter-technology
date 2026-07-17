import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  AlertTriangle,
  BadgePercent,
  Boxes,
  CheckCircle2,
  ClipboardList,
  DatabaseZap,
  HeartPulse,
  MessageSquareText,
  PackageSearch,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MarketplaceSyncControl } from "./automation/marketplace-sync-control";
import { formatDate, money } from "./utils";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "CETER Technologies operations centre.",
};

function sumOrders(orders: Array<{ totalAmount: unknown }>) {
  return orders.reduce((sum, order) => sum + Number(String(order.totalAmount)), 0);
}

export default async function AdminPage() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    totalProducts,
    activeProducts,
    outOfStockProducts,
    lowStockProducts,
    pendingOrders,
    monthOrders,
    recentOrders,
    recentEnquiries,
    activePromotions,
    latestImport,
    failedJobs,
    runningJobs,
    draftProducts,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.product.count({ where: { OR: [{ status: "OUT_OF_STOCK" }, { stock: { lte: 0 } }] } }),
    prisma.product.count({ where: { stock: { gt: 0, lte: 5 } } }),
    prisma.order.count({ where: { orderStatus: { in: ["PENDING", "PROCESSING"] } } }),
    prisma.order.findMany({ where: { createdAt: { gte: monthStart }, paymentStatus: "PAID" }, select: { totalAmount: true } }),
    prisma.order.findMany({
      select: { id: true, customerName: true, orderNumber: true, totalAmount: true, orderStatus: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.quoteRequest.findMany({
      select: { id: true, name: true, company: true, productInterest: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.marketingCampaign.count({
      where: { status: "ACTIVE", startsAt: { lte: new Date() }, endsAt: { gte: new Date() } },
    }),
    prisma.importHistory.findFirst({ include: { admin: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.automationJob.count({ where: { status: "FAILED" } }),
    prisma.automationJob.count({ where: { status: { in: ["QUEUED", "RUNNING"] } } }),
    prisma.product.count({ where: { status: { in: ["DRAFT", "NEEDS_ATTENTION"] } } }),
  ]);

  const revenue = sumOrders(monthOrders);
  const healthIssues = failedJobs + outOfStockProducts + draftProducts;

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-orange-600">Operations centre</p>
              <h2 className="text-2xl font-black text-slate-950">Today&apos;s admin priorities</h2>
              <p className="mt-1 text-sm text-slate-500">Catalogue health, order flow, revenue, imports, promotions, enquiries, and automation status.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <MarketplaceSyncControl />
              <Link href="/admin/import" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50">
                <DatabaseZap className="h-4 w-4" /> Imports
              </Link>
            </div>
          </div>
        </div>
        <div className={`rounded-md border p-5 shadow-sm ${healthIssues > 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
          <div className="flex items-center gap-3">
            <HeartPulse className={healthIssues > 0 ? "h-6 w-6 text-amber-700" : "h-6 w-6 text-emerald-700"} />
            <div>
              <p className="text-sm font-black text-slate-950">System health</p>
              <p className="mt-1 text-sm text-slate-600">{healthIssues > 0 ? `${healthIssues} items need attention` : "No critical catalogue or automation issues"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric href="/admin/products" icon={Boxes} label="Total products" value={totalProducts} />
        <Metric href="/admin/products?status=ACTIVE" icon={CheckCircle2} label="Active products" value={activeProducts} />
        <Metric href="/admin/inventory" icon={AlertTriangle} label="Out of stock" value={outOfStockProducts} tone="red" />
        <Metric href="/admin/inventory" icon={PackageSearch} label="Low stock alerts" value={lowStockProducts} tone="amber" />
        <Metric href="/admin/orders" icon={ClipboardList} label="Pending orders" value={pendingOrders} tone="blue" />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric href="/admin/reports" icon={TrendingUp} label="Month revenue" value={money(revenue)} />
        <Metric href="/admin/marketing" icon={BadgePercent} label="Active promotions" value={activePromotions} />
        <Metric href="/admin/marketing" icon={MessageSquareText} label="Recent enquiries" value={recentEnquiries.length} />
        <Metric href="/admin/import" icon={DatabaseZap} label="Import status" value={latestImport ? `${latestImport.importedRecords}/${latestImport.totalRows}` : "None"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">Recent orders</h2>
              <p className="mt-1 text-sm text-slate-500">Latest order activity for sales follow-up.</p>
            </div>
            <Link href="/admin/orders" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50">View all</Link>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr><th className="py-3 pr-4">Customer</th><th className="py-3 pr-4">Order</th><th className="py-3 pr-4">Total</th><th className="py-3 pr-4">Status</th><th className="py-3">Date</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-4 pr-4 font-bold text-slate-950">{order.customerName}</td>
                    <td className="py-4 pr-4 text-slate-600">{order.orderNumber}</td>
                    <td className="py-4 pr-4 font-bold text-slate-950">{money(order.totalAmount)}</td>
                    <td className="py-4 pr-4"><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{order.orderStatus}</span></td>
                    <td className="py-4 text-slate-500">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Actionable alerts</h2>
            <div className="mt-4 space-y-3">
              <Alert href="/admin/inventory" label="Restock required" value={`${lowStockProducts + outOfStockProducts} products`} tone="red" />
              <Alert href="/admin/products?status=NEEDS_ATTENTION" label="Catalogue cleanup" value={`${draftProducts} drafts or review items`} tone="amber" />
              <Alert href="/admin/automation" label="Automation failures" value={`${failedJobs} failed jobs`} tone="slate" />
              <Alert href="/admin/automation" label="Running jobs" value={`${runningJobs} queued or running`} tone="blue" />
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Recent customer enquiries</h2>
            <div className="mt-4 space-y-3">
              {recentEnquiries.map((item) => (
                <div key={item.id} className="rounded-md bg-slate-50 p-3 text-sm">
                  <p className="font-bold text-slate-950">{item.name}{item.company ? `, ${item.company}` : ""}</p>
                  <p className="mt-1 text-slate-600">{item.productInterest || "General enquiry"} - {item.status}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                </div>
              ))}
              {recentEnquiries.length === 0 ? <p className="text-sm text-slate-500">No recent enquiries.</p> : null}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Latest import</h2>
            {latestImport ? (
              <div className="mt-3 text-sm text-slate-600">
                <p className="font-bold text-slate-950">{latestImport.fileName}</p>
                <p>{latestImport.type} by {latestImport.admin.name}</p>
                <p>{latestImport.importedRecords} imported, {latestImport.failedRecords} failed</p>
                <p className="text-xs text-slate-500">{formatDate(latestImport.createdAt)}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No import has been run yet.</p>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}

function Metric({ href, icon: Icon, label, value, tone = "slate" }: { href: string; icon: LucideIcon; label: string; value: string | number; tone?: "slate" | "red" | "amber" | "blue" }) {
  const tones = {
    slate: "text-slate-700 bg-slate-50",
    red: "text-red-700 bg-red-50",
    amber: "text-amber-700 bg-amber-50",
    blue: "text-blue-700 bg-blue-50",
  };
  return (
    <Link href={href} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow">
      <span className={`grid h-10 w-10 place-items-center rounded-md ${tones[tone]}`}><Icon className="h-5 w-5" /></span>
      <p className="mt-3 text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </Link>
  );
}

function Alert({ href, label, value, tone }: { href: string; label: string; value: string; tone: "red" | "amber" | "slate" | "blue" }) {
  const tones = {
    red: "border-red-200 bg-red-50 text-red-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    slate: "border-slate-200 bg-slate-50 text-slate-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
  };
  return (
    <Link href={href} className={`block rounded-md border p-3 text-sm ${tones[tone]}`}>
      <p className="font-black">{label}</p>
      <p className="mt-1">{value}</p>
    </Link>
  );
}
