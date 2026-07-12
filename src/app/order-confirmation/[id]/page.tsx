import type { Metadata } from "next";
import Image from "next/image";
import { CheckCircle2, Clock, MessageCircle, PackageCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { orderReceivedMessage, whatsappUrl } from "@/lib/whatsapp";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Order Confirmation",
  description: "Your CETER Technology order confirmation.",
};

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({ params }: Props) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true },
      },
      payments: true,
    },
  });

  if (!order) {
    notFound();
  }

  const user = await getCurrentUser();

  if (order.userId && user?.id !== order.userId && user?.role !== "ADMIN") {
    notFound();
  }

  return (
    <div className="bg-slate-50">
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                  Order received
                </p>
              </div>
              <h1 className="mt-3 text-3xl font-black text-slate-950">
                Thank you for shopping with CETER Technology.
              </h1>
              <p className="mt-2 text-slate-600">
                Your CETER Technology order has been received.
              </p>
            </div>
            <div className="rounded-md bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase text-slate-500">Order number</p>
              <p className="mt-1 text-lg font-black text-slate-950">
                {order.orderNumber}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-500">Amount</p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {formatCurrency(Number(order.totalAmount.toString()))}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-500">Payment status</p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {order.paymentStatus}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-500">Delivery status</p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {order.orderStatus}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex gap-3">
              <Clock className="mt-1 h-5 w-5 text-orange-600" />
              <div>
                <h2 className="font-black text-slate-950">Expected delivery</h2>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  CETER Technology will confirm delivery charges and schedule after
                  reviewing your address in {order.city}, {order.country}. Standard
                  delivery is prepared after payment confirmation or order approval.
                </p>
              </div>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
              <PackageCheck className="h-5 w-5 text-orange-500" />
              Products purchased
            </h2>
            <div className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 p-4 sm:grid-cols-[72px_1fr_auto] sm:items-center"
                >
                  <div className="relative aspect-square overflow-hidden rounded-md bg-slate-100">
                    {item.product.imageUrl ? (
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        fill
                        sizes="72px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="font-black text-slate-950">{item.product.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <p className="font-black text-slate-950">
                    {formatCurrency(Number(item.price.toString()) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/products">Continue Shopping</ButtonLink>
            <ButtonLink href="/orders" variant="outline">
              View Order History
            </ButtonLink>
            <ButtonLink
              href={whatsappUrl(orderReceivedMessage(order.orderNumber))}
              variant="outline"
            >
              <MessageCircle className="h-4 w-4" />
              Confirm on WhatsApp
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
