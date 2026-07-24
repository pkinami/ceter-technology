"use client";

import { CreditCard, MessageCircle, Minus, Plus, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { productOrderMessage, whatsappUrl } from "@/lib/whatsapp";
import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/types";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const disabled = product.availability === "Out of stock";
  const maxQuantity = Math.max(product.stock, 1);

  function addQuantity() {
    for (let index = 0; index < quantity; index += 1) {
      addItem(product);
    }
  }

  return (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm font-black text-slate-800">
        Quantity
        <span className="inline-flex w-fit overflow-hidden rounded-md border border-slate-200 bg-white">
          <button type="button" className="grid h-11 w-11 place-items-center text-slate-700 disabled:opacity-40" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={disabled || quantity <= 1} aria-label="Decrease quantity">
            <Minus className="h-4 w-4" />
          </button>
          <input value={quantity} onChange={(event) => setQuantity(Math.min(Math.max(Number(event.target.value) || 1, 1), maxQuantity))} className="h-11 w-16 border-x border-slate-200 text-center font-black" inputMode="numeric" aria-label="Quantity" disabled={disabled} />
          <button type="button" className="grid h-11 w-11 place-items-center text-slate-700 disabled:opacity-40" onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} disabled={disabled || quantity >= maxQuantity} aria-label="Increase quantity">
            <Plus className="h-4 w-4" />
          </button>
        </span>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="button" onClick={addQuantity} disabled={disabled}>
          <ShoppingCart className="h-4 w-4" />
          {disabled ? "Out of Stock" : "Add to Cart"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => {
            addQuantity();
            router.push("/checkout");
          }}
        >
          <CreditCard className="h-4 w-4" />
          Buy Now
        </Button>
        <ButtonLink href={whatsappUrl(productOrderMessage(product))} variant="outline" className="sm:col-span-2">
          <MessageCircle className="h-4 w-4" />
          Order via WhatsApp
        </ButtonLink>
      </div>
    </div>
  );
}
