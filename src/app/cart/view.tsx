"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Minus, Plus, ShieldCheck, Trash2, Truck } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";
import { useCartStore } from "@/store/cart-store";

export function CartView() {
  const { items, removeItem, updateQuantity, clearCart, subtotal } =
    useCartStore();
  const total = subtotal();
  const totalItems = items.reduce((count, item) => count + item.quantity, 0);
  const whatsappMessage = [
    "Hello CETER Technology,",
    "",
    "I would like to order or request a quote for:",
    ...items.map((item) => `${item.quantity} x ${item.name}`),
    "",
    `Estimated subtotal: ${formatCurrency(total)}`,
    "",
    "Name:",
    "Phone:",
    "Delivery location:",
  ].join("\n");

  return (
    <div className="bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-orange-600">CETER cart</p>
            <h1 className="mt-1 text-4xl font-black text-slate-950">Review your order</h1>
          </div>
          <div className="grid gap-2 text-sm font-bold text-slate-600 sm:grid-cols-2">
            <span className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Genuine supply
            </span>
            <span className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2">
              <Truck className="h-4 w-4 text-orange-500" />
              Delivery confirmed
            </span>
          </div>
        </div>
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
                  className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[112px_1fr_auto]"
                >
                  <div className="relative aspect-square overflow-hidden rounded-md bg-slate-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-xs font-bold text-slate-400">
                        CETER
                      </div>
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/products/${item.slug}`}
                      className="text-lg font-bold text-slate-950 hover:text-orange-600"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.brand} / {item.subcategory}
                    </p>
                    <p className="mt-3 font-black text-slate-950">
                      {formatCurrency(item.discountPrice ?? item.price)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Subtotal:{" "}
                      {formatCurrency((item.discountPrice ?? item.price) * item.quantity)}
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
              <div className="mt-5 grid gap-3 border-b border-slate-200 pb-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total items</span>
                  <span className="font-black">{totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-black">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Delivery fee</span>
                  <span className="font-black">To be confirmed</span>
                </div>
              </div>
              <div className="mt-4 flex justify-between">
                <span className="font-bold text-slate-900">Final total</span>
                <span className="text-xl font-black">{formatCurrency(total)}</span>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Delivery charges are confirmed after address review.
              </p>
              <ButtonLink href="/products" variant="outline" className="mt-5 w-full">
                Continue Shopping
              </ButtonLink>
              <ButtonLink href="/checkout" className="mt-5 w-full">
                Proceed to Checkout
              </ButtonLink>
              <ButtonLink href={whatsappUrl(whatsappMessage)} variant="outline" className="mt-3 w-full">
                <MessageCircle className="h-4 w-4" />
                Order via WhatsApp
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
