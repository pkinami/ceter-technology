import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { BarChart3, Boxes, ClipboardList, PackageSearch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { money } from "../utils";

export const metadata: Metadata = {
  title: "Reports",
  description: "Business reports and marketplace performance summaries.",
};

export default async function ReportsPage() {
  await requirePermission("REPORTS", "VIEW");
  const [orders, productCount, lowStock, topProducts] = await Promise.all([
    prisma.order.findMany({ include: { items: { include: { product: true } } }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.product.count(),
    prisma.product.count({ where: { stock: { lte: 5 } } }),
    prisma.product.findMany({ include: { _count: { select: { orderItems: true, views: true } } }, orderBy: { updatedAt: "desc" }, take: 20 }),
  ]);
  const revenue = orders.reduce((sum, order) => sum + Number(order.totalAmount.toString()), 0);
  const paidOrders = orders.filter((order) => order.paymentStatus === "PAID").length;

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-orange-600">Business intelligence</p>
          <h1 className="text-2xl font-black text-slate-950">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">Sales, catalogue, inventory, and product performance summaries.</p>
        </div>
        <Link href="/admin/analytics" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 hover:bg-white">
          <BarChart3 className="h-4 w-4" /> Open analytics workspace
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={ClipboardList} label="Recent orders" value={orders.length} />
        <Metric icon={BarChart3} label="Recent revenue" value={money(revenue)} />
        <Metric icon={Boxes} label="Catalogue size" value={productCount} />
        <Metric icon={PackageSearch} label="Low stock" value={lowStock} />
      </div>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Sales summary</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-md bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Paid orders</p><p className="mt-1 text-2xl font-black text-slate-950">{paidOrders}</p></div>
          <div className="rounded-md bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Average order value</p><p className="mt-1 text-2xl font-black text-slate-950">{money(orders.length ? revenue / orders.length : 0)}</p></div>
          <div className="rounded-md bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Open orders</p><p className="mt-1 text-2xl font-black text-slate-950">{orders.filter((order) => ["PENDING", "PROCESSING"].includes(order.orderStatus)).length}</p></div>
        </div>
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Product performance</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="py-3 pr-4">Product</th><th className="py-3 pr-4">Orders</th><th className="py-3 pr-4">Views</th><th className="py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-200">
              {topProducts.map((product) => (
                <tr key={product.id}><td className="py-3 pr-4 font-bold text-slate-950">{product.name}</td><td className="py-3 pr-4">{product._count.orderItems}</td><td className="py-3 pr-4">{product._count.views}</td><td className="py-3">{product.status}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <Icon className="h-5 w-5 text-orange-500" />
      <p className="mt-3 text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}
