import type { Metadata } from "next";
import { connection } from "next/server";
import { PackageSearch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Track Order",
  description: "Track a CETER Technologies order by order number, tracking number, email, or phone.",
};

type Props = {
  searchParams: Promise<{ reference?: string; contact?: string }>;
};

export default async function TrackOrderPage({ searchParams }: Props) {
  await connection();
  const { reference, contact } = await searchParams;
  const cleanReference = reference?.trim();
  const cleanContact = contact?.trim();
  const order =
    cleanReference && cleanContact
      ? await prisma.order.findFirst({
          where: {
            AND: [
              { OR: [{ orderNumber: cleanReference }, { trackingNumber: cleanReference }] },
              { OR: [{ customerEmail: { equals: cleanContact, mode: "insensitive" } }, { customerPhone: cleanContact }] },
            ],
          },
          include: { items: { include: { product: true } } },
        })
      : null;

  return (
    <div className="bg-slate-50">
      <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-wide text-orange-300">Track order</p>
          <h1 className="mt-3 text-4xl font-black">Check your order status</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Enter your order or tracking number plus the email or phone used at checkout.</p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <form action="/track-order" className="grid gap-4 rounded-md border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-[1fr_1fr_auto]">
          <input name="reference" defaultValue={cleanReference ?? ""} required placeholder="Order or tracking number" className="h-12 rounded-md border border-slate-200 px-3" />
          <input name="contact" defaultValue={cleanContact ?? ""} required placeholder="Email or phone" className="h-12 rounded-md border border-slate-200 px-3" />
          <button className="inline-flex min-h-12 items-center justify-center rounded-md bg-orange-500 px-4 text-sm font-black text-white hover:bg-orange-600">
            <PackageSearch className="mr-2 h-4 w-4" />
            Track
          </button>
        </form>
        {cleanReference && cleanContact ? (
          order ? (
            <article className="mt-6 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Order {order.orderNumber}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Status label="Order" value={order.orderStatus} />
                <Status label="Payment" value={order.paymentStatus} />
                <Status label="Delivery" value={order.deliveryStatus} />
              </div>
              <p className="mt-5 text-sm font-semibold text-slate-600">Total: {formatCurrency(Number(order.totalAmount.toString()))}</p>
              <div className="mt-4 divide-y divide-slate-200 rounded-md border border-slate-200">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 p-3 text-sm">
                    <span className="font-semibold text-slate-700">{item.product.name}</span>
                    <span className="text-slate-500">Qty {item.quantity}</span>
                  </div>
                ))}
              </div>
            </article>
          ) : (
            <div className="mt-6 rounded-md border border-orange-200 bg-orange-50 p-5 text-sm font-semibold text-orange-900">
              No matching order was found for those details.
            </div>
          )
        ) : null}
      </section>
    </div>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-black text-slate-950">{value}</p>
    </div>
  );
}
