import type { Metadata } from "next";
import { ClipboardList, Eye, MessageSquarePlus, Save, Search } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { addOrderIssue, updateOrderDetails, updateOrderStatus } from "../actions";
import { formatDate, money } from "../utils";

export const metadata: Metadata = {
  title: "Orders",
  description: "Manage CETER Technology customer orders, notes, and fulfillment status.",
};

const orderStatuses = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

const deliveryStatuses = [
  "PENDING",
  "READY_FOR_DISPATCH",
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED",
  "RETURNED",
] as const;

type Props = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requirePermission("ORDERS", "VIEW");
  const { q } = await searchParams;
  const query = q?.trim();

  const orders = await prisma.order.findMany({
    where: query
      ? {
          OR: [
            { trackingNumber: { contains: query, mode: "insensitive" } },
            { orderNumber: { contains: query, mode: "insensitive" } },
            { customerName: { contains: query, mode: "insensitive" } },
            { customerPhone: { contains: query, mode: "insensitive" } },
            { customerEmail: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      user: true,
      payments: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
      issues: { orderBy: { createdAt: "desc" } },
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-wide text-orange-600">Orders</p>
        <h1 className="text-2xl font-black text-slate-950">Customer orders and fulfillment</h1>
        <p className="mt-1 text-sm text-slate-500">Review orders, update fulfillment, edit delivery details, and record internal handling notes.</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-orange-500" />
            <div>
              <h2 className="text-xl font-black text-slate-950">Customer orders</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search, update fulfillment, add internal notes, and track order issues.
              </p>
            </div>
          </div>
          <form className="flex w-full gap-2 lg:w-[460px]">
            <input
              name="q"
              defaultValue={query ?? ""}
              placeholder="Tracking, order, name, phone, or email"
              className="min-h-11 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
              <Search className="h-4 w-4" />
              Search
            </button>
          </form>
        </div>

        <div className="mt-6 space-y-5">
          {orders.map((order) => (
            <article key={order.id} className="rounded-lg border border-slate-200 p-4">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-black text-slate-950">Order {order.orderNumber}</h3>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                      Tracking {order.trackingNumber}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                    <div>
                      <p className="font-bold text-slate-950">{order.customerName}</p>
                      <p>{order.customerPhone}</p>
                      <p>{order.customerEmail}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-950">Delivery</p>
                      <p>{order.deliveryAddress}</p>
                      <p>{order.city}, {order.country}</p>
                    </div>
                  </div>

                  <div className="mt-4 divide-y divide-slate-100 rounded-md bg-slate-50 px-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                        <span className="font-semibold text-slate-700">
                          {item.quantity} x {item.product.name}
                        </span>
                        <span className="font-bold text-slate-950">{money(item.price)}</span>
                      </div>
                    ))}
                  </div>

                  <details className="mt-4 rounded-md bg-slate-50 p-4">
                    <summary className="cursor-pointer text-sm font-black text-slate-950">
                      Status history and support issues
                    </summary>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-black text-slate-950">Status history</h4>
                        <div className="mt-2 space-y-2">
                          {order.statusHistory.map((history) => (
                            <div key={history.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
                              <p className="font-bold text-slate-950">
                                {history.previousStatus ?? "NEW"} to {history.newStatus}
                              </p>
                              <p className="text-xs text-slate-500">{formatDate(history.createdAt)}</p>
                              {history.note ? <p className="mt-1 text-slate-600">{history.note}</p> : null}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-950">Issues</h4>
                        <div className="mt-2 space-y-2">
                          {order.issues.map((issue) => (
                            <div key={issue.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
                              <p className="font-bold text-slate-950">{issue.title}</p>
                              <p className="text-xs font-bold text-orange-700">{issue.status}</p>
                              <p className="mt-1 text-slate-600">{issue.note}</p>
                            </div>
                          ))}
                          {order.issues.length === 0 ? (
                            <p className="text-sm text-slate-500">No issues logged.</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </details>
                </div>

                <div className="space-y-4">
                  <div className="rounded-md border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-700">Order total</p>
                    <p className="mt-1 text-2xl font-black text-slate-950">{money(order.totalAmount)}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
                      <span className="rounded-md bg-orange-50 px-2 py-1 text-orange-700">{order.paymentMethod}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">{order.paymentStatus}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">{order.orderStatus}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">{order.deliveryStatus}</span>
                    </div>
                  </div>

                  <form action={updateOrderStatus} className="grid gap-3 rounded-md border border-slate-200 p-4">
                    <input type="hidden" name="orderId" value={order.id} />
                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                      Order status
                      <select name="status" defaultValue={order.orderStatus} className="rounded-md border border-slate-300 px-3 py-2">
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                      Status note
                      <input name="note" className="rounded-md border border-slate-300 px-3 py-2" />
                    </label>
                    <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800">
                      <Save className="h-4 w-4" />
                      Update status
                    </button>
                  </form>

                  <details className="rounded-md border border-slate-200 p-4">
                    <summary className="cursor-pointer text-sm font-black text-slate-950">Edit order details</summary>
                    <form action={updateOrderDetails} className="mt-4 grid gap-3">
                      <input type="hidden" name="orderId" value={order.id} />
                      <input name="customerName" defaultValue={order.customerName} required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                      <input name="customerEmail" defaultValue={order.customerEmail} required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                      <input name="customerPhone" defaultValue={order.customerPhone} required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                      <input name="deliveryAddress" defaultValue={order.deliveryAddress} required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input name="city" defaultValue={order.city} required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                        <input name="country" defaultValue={order.country} required className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                      </div>
                      <select name="deliveryStatus" defaultValue={order.deliveryStatus} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                        {deliveryStatuses.map((status) => (
                          <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                        ))}
                      </select>
                      <input name="deliveryProvider" defaultValue={order.deliveryProvider ?? ""} placeholder="Courier or delivery provider" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                      <textarea name="internalNotes" defaultValue={order.internalNotes ?? ""} rows={3} placeholder="Internal notes" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                      <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800">
                        <Save className="h-4 w-4" />
                        Save details
                      </button>
                    </form>
                  </details>

                  <details className="rounded-md border border-slate-200 p-4">
                    <summary className="cursor-pointer text-sm font-black text-slate-950">Add complaint or issue</summary>
                    <form action={addOrderIssue} className="mt-4 grid gap-3">
                      <input type="hidden" name="orderId" value={order.id} />
                      <input name="title" required placeholder="Issue title" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                      <select name="status" defaultValue="OPEN" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                        <option value="OPEN">OPEN</option>
                        <option value="IN_REVIEW">IN REVIEW</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                      <textarea name="note" required rows={3} placeholder="Customer complaint or internal handling note" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                      <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-orange-500 px-3 py-2 text-sm font-bold text-white hover:bg-orange-600">
                        <MessageSquarePlus className="h-4 w-4" />
                        Add issue
                      </button>
                    </form>
                  </details>

                  <Link
                    href={`/order-confirmation/${order.id}`}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:border-orange-300 hover:bg-orange-50"
                  >
                    <Eye className="h-4 w-4" />
                    Customer receipt
                  </Link>
                </div>
              </div>
            </article>
          ))}
          {orders.length === 0 ? (
            <p className="rounded-md bg-slate-50 p-6 text-sm text-slate-500">
              No matching customer orders.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
