"use client";

import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

export function CheckoutSummary() {
  const { items, subtotal } = useCartStore();
  const total = subtotal();

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
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))
        )}
      </div>
      <div className="mt-5 flex justify-between border-t border-slate-200 pt-5">
        <span className="font-bold">Total</span>
        <span className="text-xl font-black">{formatCurrency(total)}</span>
      </div>
    </aside>
  );
}
