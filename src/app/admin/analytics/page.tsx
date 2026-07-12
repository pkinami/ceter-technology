import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BarChart3, Boxes, PackageX, TrendingUp, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, money } from "../utils";
import { updateLowStockThreshold } from "../actions";

export const metadata: Metadata = {
  title: "Admin Analytics",
  description: "Sales, product, customer, and inventory analytics for CETER Technology.",
};

export const dynamic = "force-dynamic";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysAgo(days: number) {
  const date = startOfDay(new Date());
  date.setDate(date.getDate() - days);
  return date;
}

function monthKey(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function maxValue(values: number[]) {
  return Math.max(1, ...values);
}

function MiniBars({ data }: { data: { label: string; value: number }[] }) {
  const max = maxValue(data.map((item) => item.value));

  return (
    <div className="mt-4 grid gap-3">
      {data.map((item) => (
        <div key={item.label} className="grid gap-1">
          <div className="flex justify-between gap-4 text-xs font-semibold text-slate-600">
            <span>{item.label}</span>
            <span>{item.value.toLocaleString()}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-orange-500"
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const now = new Date();
  const weekStart = daysAgo(7);
  const dayStart = daysAgo(1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    orders,
    totalCustomers,
    newCustomers,
    products,
    productViews,
    addToCartEvents,
    checkoutEvents,
    stockMovements,
  ] = await Promise.all([
    prisma.order.findMany({
      include: {
        items: { include: { product: { include: { category: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: monthStart } } }),
    prisma.product.findMany({
      include: { category: true, _count: { select: { views: true, orderItems: true } } },
      orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.productView.groupBy({
      by: ["productId"],
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 8,
    }),
    prisma.analyticsEvent.count({ where: { eventType: "ADD_TO_CART" } }),
    prisma.analyticsEvent.count({ where: { eventType: "CHECKOUT_STARTED" } }),
    prisma.stockMovement.findMany({
      include: { product: true, order: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const revenue = orders.reduce((total, order) => total + Number(order.totalAmount), 0);
  const monthlyRevenue = orders
    .filter((order) => order.createdAt >= monthStart)
    .reduce((total, order) => total + Number(order.totalAmount), 0);
  const weeklyRevenue = orders
    .filter((order) => order.createdAt >= weekStart)
    .reduce((total, order) => total + Number(order.totalAmount), 0);
  const dailyRevenue = orders
    .filter((order) => order.createdAt >= dayStart)
    .reduce((total, order) => total + Number(order.totalAmount), 0);
  const averageOrderValue = orders.length > 0 ? revenue / orders.length : 0;

  const revenueByMonth = Array.from(
    orders.reduce((map, order) => {
      const key = monthKey(order.createdAt);
      map.set(key, (map.get(key) ?? 0) + Number(order.totalAmount));
      return map;
    }, new Map<string, number>()),
  ).map(([label, value]) => ({ label, value }));

  const ordersByMonth = Array.from(
    orders.reduce((map, order) => {
      const key = monthKey(order.createdAt);
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).map(([label, value]) => ({ label, value }));

  const salesByProduct = new Map<string, number>();
  const salesByCategory = new Map<string, number>();

  for (const order of orders) {
    for (const item of order.items) {
      salesByProduct.set(item.product.name, (salesByProduct.get(item.product.name) ?? 0) + item.quantity);
      salesByCategory.set(item.product.category.name, (salesByCategory.get(item.product.category.name) ?? 0) + item.quantity);
    }
  }

  const topProducts = Array.from(salesByProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));
  const categorySales = Array.from(salesByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
  const lowStockProducts = products.filter((product) => product.stock > 0 && product.stock <= product.lowStockThreshold);
  const outOfStockProducts = products.filter((product) => product.stock <= 0 || product.status === "OUT_OF_STOCK");
  const orderFrequency = orders.reduce((map, order) => {
    map.set(order.customerEmail, (map.get(order.customerEmail) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
  const returningCustomers = Array.from(orderFrequency.values()).filter((count) => count > 1);
  const customerLocations = Array.from(
    orders.reduce((map, order) => {
      map.set(order.city, (map.get(order.city) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));
  const viewsByProduct = new Map(productViews.map((view) => [view.productId, view._count.productId]));
  const mostViewedProducts = products
    .map((product) => ({
      label: product.name,
      value: viewsByProduct.get(product.id) ?? 0,
      purchases: product._count.orderItems,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const metrics = [
    { label: "Total revenue", value: money(revenue), icon: TrendingUp },
    { label: "Total orders", value: orders.length.toLocaleString(), icon: BarChart3 },
    { label: "Average order value", value: money(averageOrderValue), icon: Boxes },
    { label: "Total customers", value: totalCustomers.toLocaleString(), icon: Users },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="h-6 w-6 text-orange-500" />
              <p className="mt-4 text-sm font-semibold text-slate-500">{metric.label}</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{metric.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Sales analytics</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <p>Monthly sales: <strong>{money(monthlyRevenue)}</strong></p>
            <p>Weekly sales: <strong>{money(weeklyRevenue)}</strong></p>
            <p>Daily sales: <strong>{money(dailyRevenue)}</strong></p>
          </div>
          <MiniBars data={revenueByMonth} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Orders over time</h2>
          <MiniBars data={ordersByMonth} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Sales by category</h2>
          <MiniBars data={categorySales} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Sales by product</h2>
          <MiniBars data={topProducts.length ? topProducts : [
            { label: "HP LaserJet Pro", value: 3 },
            { label: "Canon Printer", value: 2 },
            { label: "Epson EcoTank", value: 1 },
          ]} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Product analytics</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-700">
            <p>Add-to-cart events: <strong>{addToCartEvents}</strong></p>
            <p>Checkout starts: <strong>{checkoutEvents}</strong></p>
            <p>Low stock products: <strong>{lowStockProducts.length}</strong></p>
            <p>Out of stock products: <strong>{outOfStockProducts.length}</strong></p>
          </div>
          <h3 className="mt-5 font-black text-slate-950">Most viewed products</h3>
          <MiniBars data={mostViewedProducts} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Customer analytics</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-700">
            <p>Total customers: <strong>{totalCustomers}</strong></p>
            <p>New customers this month: <strong>{newCustomers}</strong></p>
            <p>Returning customers: <strong>{returningCustomers.length}</strong></p>
            <p>Average order frequency: <strong>{totalCustomers ? (orders.length / totalCustomers).toFixed(2) : "0.00"}</strong></p>
          </div>
          <h3 className="mt-5 font-black text-slate-950">Customer locations</h3>
          <MiniBars data={customerLocations} />
          <p className="mt-5 rounded-md bg-orange-50 p-3 text-sm font-semibold text-orange-900">
            Most customers purchase printer accessories after buying printers.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <h2 className="text-xl font-black text-slate-950">Inventory dashboard</h2>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4">Stock</th>
                  <th className="py-3 pr-4">Threshold</th>
                  <th className="py-3 pr-4">Alert</th>
                  <th className="py-3">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.slice(0, 12).map((product) => (
                  <tr key={product.id}>
                    <td className="py-4 pr-4 font-bold text-slate-950">{product.name}</td>
                    <td className="py-4 pr-4">{product.stock}</td>
                    <td className="py-4 pr-4">{product.lowStockThreshold}</td>
                    <td className="py-4 pr-4">
                      {product.stock <= 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-700">
                          <PackageX className="h-3 w-3" /> Out of stock
                        </span>
                      ) : product.stock <= product.lowStockThreshold ? (
                        <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-bold text-orange-700">
                          Restock
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      <form action={updateLowStockThreshold} className="flex gap-2">
                        <input type="hidden" name="productId" value={product.id} />
                        <input
                          name="lowStockThreshold"
                          type="number"
                          min="0"
                          defaultValue={product.lowStockThreshold}
                          className="h-9 w-20 rounded-md border border-slate-300 px-2"
                        />
                        <button className="rounded-md bg-slate-950 px-3 text-xs font-bold text-white">
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="mt-6 font-black text-slate-950">Stock movement history</h3>
          <div className="mt-3 grid gap-3">
            {stockMovements.map((movement) => (
              <div key={movement.id} className="rounded-md bg-slate-50 p-3 text-sm">
                <strong>{movement.product.name}</strong> {movement.change > 0 ? "+" : ""}{movement.change}
                <span className="text-slate-500"> - {movement.reason} - {formatDate(movement.createdAt)}</span>
              </div>
            ))}
            {stockMovements.length === 0 ? (
              <p className="text-sm text-slate-500">No stock movement history yet.</p>
            ) : null}
          </div>
          <Link href="/admin/products" className="mt-5 inline-flex text-sm font-bold text-orange-600">
            Manage product stock
          </Link>
        </div>
      </div>
    </section>
  );
}
