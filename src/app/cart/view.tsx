"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

export function CartView() {
  const { items, removeItem, updateQuantity, clearCart, subtotal } =
    useCartStore();
  const total = subtotal();

  return (
    <div className="bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-slate-950">Shopping cart</h1>
        {items.length === 0 ? (
          <div className="mt-8 rounded-lg bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">Your cart is currently empty.</p>
            <ButtonLink href="/products" className="mt-5">
              Browse Products
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="grid gap-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <Link
                      href={`/products/${item.slug}`}
                      className="text-lg font-bold text-slate-950 hover:text-orange-600"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.subcategory}
                    </p>
                    <p className="mt-3 font-black text-slate-950">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="grid h-10 w-10 place-items-center rounded-md border border-slate-200"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-8 text-center font-bold">
                      {item.quantity}
                    </span>
                    <button
                      className="grid h-10 w-10 place-items-center rounded-md border border-slate-200"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      className="grid h-10 w-10 place-items-center rounded-md border border-red-200 text-red-600"
                      onClick={() => removeItem(item.id)}
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">Order summary</h2>
              <div className="mt-5 flex justify-between border-b border-slate-200 pb-4">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-black">{formatCurrency(total)}</span>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Delivery charges are confirmed after address review.
              </p>
              <ButtonLink href="/checkout" className="mt-5 w-full">
                Proceed to Checkout
              </ButtonLink>
              <Button
                variant="outline"
                className="mt-3 w-full"
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}
