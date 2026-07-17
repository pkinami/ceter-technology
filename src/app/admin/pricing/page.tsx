import type { Metadata } from "next";
import { BadgePercent, TrendingDown, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { bulkUpdateProducts, createPriceRule } from "../actions";
import { formatDate, money } from "../utils";

export const metadata: Metadata = {
  title: "Price Management",
  description: "Price history, rules, margins, and bulk price changes.",
};

function margin(cost: unknown, price: unknown) {
  const c = Number(String(cost ?? 0));
  const p = Number(String(price ?? 0));
  return c > 0 && p > 0 ? (((p - c) / p) * 100).toFixed(1) : "-";
}

export default async function PricingPage() {
  await requirePermission("PRODUCTS", "EDIT");
  const [products, categories, priceHistory, rules] = await Promise.all([
    prisma.product.findMany({ include: { category: true, supplier: true }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.priceHistory.findMany({ include: { product: true }, orderBy: { createdAt: "desc" }, take: 25 }),
    prisma.priceRule.findMany({ orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }], take: 10 }),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-wide text-orange-600">Commercial control</p>
        <h1 className="text-2xl font-black text-slate-950">Price management</h1>
        <p className="mt-1 text-sm text-slate-500">Margin review, bulk price changes, discount schedules, supplier price visibility, and price rule setup.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-6">
          <form action={bulkUpdateProducts} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3"><BadgePercent className="h-5 w-5 text-orange-500" /><h2 className="text-lg font-black text-slate-950">Bulk price change</h2></div>
            <input type="hidden" name="operation" value="price" />
            <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
              New selling price
              <input name="price" required type="number" min="0" step="0.01" className="h-10 rounded-md border border-slate-300 px-3" />
            </label>
            <fieldset className="mt-4 max-h-64 overflow-y-auto rounded-md border border-slate-200 p-3 text-sm">
              <legend className="px-1 font-bold text-slate-700">Products</legend>
              {products.map((product) => (
                <label key={product.id} className="flex items-center gap-2 py-1">
                  <input type="checkbox" name="productIds" value={product.id} className="accent-orange-500" />
                  {product.name} - {money(product.price)}
                </label>
              ))}
            </fieldset>
            <button className="mt-4 min-h-10 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">Apply price</button>
          </form>

          <form action={createPriceRule} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Pricing rule</h2>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">Rule name<input name="name" required className="h-10 rounded-md border border-slate-300 px-3" /></label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Scope
                <select name="scope" className="h-10 rounded-md border border-slate-300 px-3">
                  <option value="GLOBAL">Global</option><option value="CATEGORY">Category</option><option value="BRAND">Brand</option><option value="PRODUCT">Product</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">Category<select name="categoryId" className="h-10 rounded-md border border-slate-300 px-3"><option value="">None</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">Brand<input name="brand" className="h-10 rounded-md border border-slate-300 px-3" /></label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">Product<select name="productId" className="h-10 rounded-md border border-slate-300 px-3"><option value="">None</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">Target margin %<input name="targetMarginPercent" required type="number" step="0.01" defaultValue={20} className="h-10 rounded-md border border-slate-300 px-3" /></label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">Operating cost %<input name="operatingCostPercent" type="number" step="0.01" defaultValue={0} className="h-10 rounded-md border border-slate-300 px-3" /></label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">Kenya adjustment %<input name="kenyaAdjustmentPercent" type="number" step="0.01" defaultValue={0} className="h-10 rounded-md border border-slate-300 px-3" /></label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">Minimum margin amount<input name="minimumMarginAmount" type="number" step="0.01" defaultValue={0} className="h-10 rounded-md border border-slate-300 px-3" /></label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input name="isActive" type="checkbox" defaultChecked className="accent-orange-500" /> Active</label>
              <button className="min-h-10 rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">Create rule</button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Margin review</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="py-3 pr-3">Product</th><th className="py-3 pr-3">Supplier</th><th className="py-3 pr-3">Cost</th><th className="py-3 pr-3">Price</th><th className="py-3">Margin</th></tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {products.map((product) => (
                    <tr key={product.id}><td className="py-3 pr-3 font-bold text-slate-950">{product.name}</td><td className="py-3 pr-3 text-slate-600">{product.supplier?.name ?? "-"}</td><td className="py-3 pr-3">{money(product.costPrice)}</td><td className="py-3 pr-3">{money(product.price)}</td><td className="py-3 font-bold">{margin(product.costPrice, product.price)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Price history</h2>
            <div className="mt-4 space-y-3">
              {priceHistory.map((item) => (
                <div key={item.id} className="rounded-md bg-slate-50 p-3 text-sm">
                  <p className="font-bold text-slate-950">{item.product.name}</p>
                  <p className="mt-1 text-slate-600">Recommended {money(item.recommendedPrice)} from {item.source} - margin {item.targetMarginPercent.toString()}%</p>
                  <p className="mt-1 text-xs text-slate-500">{item.reason || "No reason supplied"} - {formatDate(item.createdAt)}</p>
                </div>
              ))}
              {priceHistory.length === 0 ? <p className="text-sm text-slate-500">No price history yet. Supplier sync and manual pricing changes will populate this trail.</p> : null}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Active rules</h2>
            <div className="mt-4 grid gap-3">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm">
                  <div><p className="font-bold text-slate-950">{rule.name}</p><p className="text-slate-600">{rule.scope} - target {rule.targetMarginPercent.toString()}%</p></div>
                  {rule.isActive ? <TrendingUp className="h-5 w-5 text-emerald-600" /> : <TrendingDown className="h-5 w-5 text-slate-400" />}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
