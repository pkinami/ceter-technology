import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { PackageCheck } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "My Orders",
  description: "View your CETER Technology order history.",
};

function money(value: { toString(): string }) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(Number(value.toString()));
}

export default async function OrdersPage() {
  await connection();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <PackageCheck className="h-8 w-8 text-orange-500" />
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
              Customer account
            </p>
            <h1 className="text-4xl font-black text-slate-950">My orders</h1>
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-black text-slate-950">
                    Order {order.orderNumber}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {order.createdAt.toLocaleDateString("en-KE", {
                      dateStyle: "medium",
                    })}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-black text-slate-950">
                    {money(order.totalAmount)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
                    <span className="rounded-md bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                      Payment: {order.paymentStatus}
                    </span>
                    <span className="rounded-md bg-orange-50 px-3 py-1 text-sm font-bold text-orange-700">
                      Delivery: {order.orderStatus}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-5 divide-y divide-slate-200">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 py-3">
                    <span className="font-semibold text-slate-700">
                      {item.product.name}
                    </span>
                    <span className="text-sm text-slate-500">
                      {item.quantity} x {money(item.price)}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href={`/order-confirmation/${order.id}`}
                className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 hover:border-orange-300 hover:bg-orange-50"
              >
                View details
              </Link>
            </article>
          ))}
          {orders.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-slate-600">You do not have any orders yet.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
