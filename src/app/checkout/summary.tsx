"use client";

import { MessageCircle } from "lucide-react";
import { company } from "@/lib/company";
import { formatCurrency } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";
import { useCartStore } from "@/store/cart-store";

export function CheckoutSummary() {
  const { items, subtotal } = useCartStore();
  const total = subtotal();
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  const whatsappMessage = [
    `Hello ${company.tradingName},`,
    "",
    "I would like help completing this order:",
    ...items.map((item) => `${item.name} x ${item.quantity}`),
    "",
    `Total: ${formatCurrency(total)}`,
  ].join("\n");

  return (
    <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black">Order summary</h2>
      <div className="mt-5 grid gap-4">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No cart items yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 text-sm">
              <span className="text-slate-600">
                {item.name} x {item.quantity}
              </span>
              <span className="font-bold">
                {formatCurrency((item.discountPrice ?? item.price) * item.quantity)}
              </span>
            </div>
          ))
        )}
      </div>
      <div className="mt-5 grid gap-3 border-t border-slate-200 pt-5 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Total items</span>
          <span className="font-bold">{itemCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Subtotal</span>
          <span className="font-bold">{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Delivery fee</span>
          <span className="font-bold">To be confirmed</span>
        </div>
      </div>
      <div className="mt-4 flex justify-between">
        <span className="font-bold">Total amount</span>
        <span className="text-xl font-black">{formatCurrency(total)}</span>
      </div>
      <a
        href={whatsappUrl(whatsappMessage)}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
      >
        <MessageCircle className="h-4 w-4" />
        Order via WhatsApp
      </a>
    </aside>
  );
}
