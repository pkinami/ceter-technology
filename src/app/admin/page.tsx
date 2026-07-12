import type { Metadata } from "next";
import Link from "next/link";
import {
  Boxes,
  Bot,
  AlertTriangle,
  ClipboardList,
  DatabaseZap,
  Megaphone,
  PackagePlus,
  MessageSquareText,
  Tags,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MarketplaceSyncControl } from "./automation/marketplace-sync-control";
import { formatDate, money } from "./utils";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Protected admin dashboard for CETER Technology.",
};

export default async function AdminPage() {
  const [
    totalProducts,
    totalCategories,
    totalOrders,
    totalCustomers,
    lowStockProducts,
    draftProducts,
    pendingOrders,
    quoteRequests,
    recentOrders,
    recentLogs,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count({
      where: {
        OR: [{ status: "OUT_OF_STOCK" }, { stock: { lte: 5 } }],
      },
    }),
    prisma.product.count({ where: { status: { in: ["DRAFT", "NEEDS_ATTENTION"] } } }),
    prisma.order.count({ where: { orderStatus: { in: ["PENDING", "PROCESSING"] } } }),
    prisma.quoteRequest.count({ where: { status: "NEW" } }),
    prisma.order.findMany({
      include: {
        user: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.adminLog.findMany({
      include: { admin: true },
      orderBy: { timestamp: "desc" },
      take: 5,
    }),
  ]);

  const metrics = [
    { label: "Total products", value: totalProducts, icon: Boxes, href: "/admin/products" },
    { label: "Total categories", value: totalCategories, icon: Tags, href: "/admin/categories" },
    { label: "Total orders", value: totalOrders, icon: ClipboardList, href: "/admin/orders" },
    { label: "Total customers", value: totalCustomers, icon: Users, href: "/admin/customers" },
  ];
  const priorityMetrics = [
    { label: "Low stock alerts", value: lowStockProducts, icon: AlertTriangle, href: "/admin/products", tone: "text-red-700 bg-red-50" },
    { label: "Drafts needing work", value: draftProducts, icon: PackagePlus, href: "/admin/products", tone: "text-amber-700 bg-amber-50" },
    { label: "Orders to process", value: pendingOrders, icon: ClipboardList, href: "/admin/orders", tone: "text-blue-700 bg-blue-50" },
    { label: "New quote requests", value: quoteRequests, icon: MessageSquareText, href: "/admin/marketing", tone: "text-emerald-700 bg-emerald-50" },
  ];
  const workflows = [
    { label: "Add product", description: "Create a product, upload images, add specs, stock, price, and badges.", href: "/admin/products", icon: PackagePlus },
    { label: "Bulk import", description: "Upload catalogue spreadsheets and review import results.", href: "/admin/import", icon: DatabaseZap },
    { label: "Manage orders", description: "Update status, delivery, notes, customer details, and receipts.", href: "/admin/orders", icon: ClipboardList },
    { label: "Promotions", description: "Update banners, featured products, discounts, and marketplace campaigns.", href: "/admin/marketing", icon: Megaphone },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-lg border border-orange-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-orange-600">Automation command center</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Marketplace product sync</h2>
            <p className="mt-1 text-sm text-slate-500">
              Start catalogue discovery, enrichment, image collection, price updates, and publishing feedback from the dashboard.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <MarketplaceSyncControl />
            <Link
              href="/admin/automation"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
            >
              <Bot className="h-4 w-4" />
              Automation
            </Link>
            <Link
              href="/admin/data-sources"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-sm"
            >
              <DatabaseZap className="h-4 w-4" />
              Data sources
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {priorityMetrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Link key={metric.label} href={metric.href} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md">
              <span className={`inline-grid h-10 w-10 place-items-center rounded-md ${metric.tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-bold text-slate-500">{metric.label}</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{metric.value}</p>
            </Link>
          );
        })}
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workflows.map((workflow) => {
          const Icon = workflow.icon;

          return (
            <Link key={workflow.label} href={workflow.href} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-orange-50 text-orange-600">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="font-black text-slate-950">{workflow.label}</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{workflow.description}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Link
              key={metric.label}
              href={metric.href}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {metric.value}
                  </p>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-md bg-orange-50 text-orange-600">
                  <Icon className="h-6 w-6" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">Recent orders</h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest customer orders across the store.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-sm"
            >
              View all
            </Link>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4">Order</th>
                  <th className="py-3 pr-4">Items</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-4 pr-4 font-bold text-slate-950">
                      {order.customerName}
                    </td>
                    <td className="py-4 pr-4 text-slate-600">
                      {order.orderNumber}
                    </td>
                    <td className="py-4 pr-4 text-slate-600">
                      {order.items.length} item{order.items.length === 1 ? "" : "s"}
                    </td>
                    <td className="py-4 pr-4 font-bold text-slate-950">
                      {money(order.totalAmount)}
                    </td>
                    <td className="py-4 pr-4">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-4 text-slate-500">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrders.length === 0 ? (
              <p className="py-6 text-sm text-slate-500">No orders yet.</p>
            ) : null}
          </div>
        </div>

        <aside className="space-y-6">
          <Link
            href="/admin/products"
            className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-5 text-orange-950 shadow-sm hover:-translate-y-0.5 hover:bg-orange-100 hover:shadow-md"
          >
            <PackagePlus className="h-6 w-6" />
            <span className="font-black">Create or update products</span>
          </Link>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Admin activity</h2>
            <div className="mt-5 space-y-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <p className="text-sm font-bold text-slate-900">{log.action}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {log.admin.name} - {formatDate(log.timestamp)}
                  </p>
                </div>
              ))}
              {recentLogs.length === 0 ? (
                <p className="text-sm text-slate-500">No admin activity yet.</p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
