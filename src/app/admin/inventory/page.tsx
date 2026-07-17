import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, FileUp, PackageSearch, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { bulkUpdateProducts, updateLowStockThreshold } from "../actions";
import { formatDate } from "../utils";

export const metadata: Metadata = {
  title: "Inventory Centre",
  description: "Stock alerts, stock movement, and replenishment management.",
};

export default async function InventoryPage() {
  await requirePermission("PRODUCTS", "VIEW");
  const [products, movements] = await Promise.all([
    prisma.product.findMany({
      include: { category: true, supplier: true },
      orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
      take: 100,
    }),
    prisma.stockMovement.findMany({
      include: { product: true, order: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);
  const lowStock = products.filter((product) => product.stock > 0 && product.stock <= product.lowStockThreshold);
  const outOfStock = products.filter((product) => product.stock <= 0 || product.status === "OUT_OF_STOCK");

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-orange-600">Stock control</p>
          <h1 className="text-2xl font-black text-slate-950">Inventory centre</h1>
          <p className="mt-1 text-sm text-slate-500">Current stock, low-stock alerts, threshold adjustments, movements, and stock import shortcuts.</p>
        </div>
        <Link href="/admin/import" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 hover:bg-white">
          <FileUp className="h-4 w-4" /> Import stock updates
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Metric label="Current products" value={products.length} />
        <Metric label="Low stock alerts" value={lowStock.length} tone="amber" />
        <Metric label="Out of stock" value={outOfStock.length} tone="red" />
      </div>

      <form action={bulkUpdateProducts} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
          <input type="hidden" name="operation" value="stock" />
          <label className="grid gap-1 text-xs font-bold uppercase text-slate-600">
            Set stock quantity
            <input name="stock" required type="number" min="0" step="1" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
          </label>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
            <Save className="h-4 w-4" /> Adjust selected
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr><th className="py-3 pr-3">Bulk</th><th className="py-3 pr-3">Product</th><th className="py-3 pr-3">Category</th><th className="py-3 pr-3">Supplier</th><th className="py-3 pr-3">Stock</th><th className="py-3 pr-3">Threshold</th><th className="py-3">Alert</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.map((product) => {
                const alert = product.stock <= 0 ? "Out of stock" : product.stock <= product.lowStockThreshold ? "Restock required" : "OK";
                return (
                  <tr key={product.id}>
                    <td className="py-3 pr-3"><input type="checkbox" name="productIds" value={product.id} className="accent-orange-500" /></td>
                    <td className="py-3 pr-3 font-bold text-slate-950">{product.name}</td>
                    <td className="py-3 pr-3 text-slate-600">{product.category.name}</td>
                    <td className="py-3 pr-3 text-slate-600">{product.supplier?.name ?? "-"}</td>
                    <td className="py-3 pr-3 font-black text-slate-950">{product.stock}</td>
                    <td className="py-3 pr-3">
                      <form action={updateLowStockThreshold} className="flex gap-2">
                        <input type="hidden" name="productId" value={product.id} />
                        <input name="lowStockThreshold" type="number" min="0" step="1" defaultValue={product.lowStockThreshold} className="h-9 w-20 rounded-md border border-slate-300 px-2" />
                        <button className="rounded-md border border-slate-300 px-2 text-xs font-bold hover:bg-slate-50">Save</button>
                      </form>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${alert === "OK" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        {alert !== "OK" ? <AlertTriangle className="h-3 w-3" /> : null}{alert}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </form>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <PackageSearch className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-black text-slate-950">Recent stock movements</h2>
        </div>
        <div className="mt-4 space-y-3">
          {movements.map((movement) => (
            <div key={movement.id} className="rounded-md bg-slate-50 p-3 text-sm">
              <p className="font-bold text-slate-950">{movement.product.name}: {movement.change > 0 ? "+" : ""}{movement.change}</p>
              <p className="mt-1 text-slate-600">{movement.reason}{movement.order ? ` - ${movement.order.orderNumber}` : ""}</p>
              <p className="mt-1 text-xs text-slate-500">{formatDate(movement.createdAt)}</p>
            </div>
          ))}
          {movements.length === 0 ? <p className="text-sm text-slate-500">No stock movements have been recorded yet.</p> : null}
        </div>
      </section>
    </section>
  );
}

function Metric({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "amber" | "red" }) {
  const tones = { slate: "bg-white", amber: "bg-amber-50 border-amber-200", red: "bg-red-50 border-red-200" };
  return <div className={`rounded-md border border-slate-200 p-4 shadow-sm ${tones[tone]}`}><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-950">{value}</p></div>;
}
