"use client";

import { Loader2, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/types";

export function AddToCartButton({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);
  const disabled = product.availability === "Out of stock";
  async function handleAddToCart() {
    if (adding || disabled) return;
    setAdding(true);
    addItem(product);
    showToast({ type: "success", title: "Added to cart", message: product.name });
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "ADD_TO_CART",
          metadata: {
            productId: product.id,
            productName: product.name,
            price: product.discountPrice ?? product.price,
          },
        }),
      });
    } finally {
      setAdding(false);
    }
  }

  return (
    <Button className={className} onClick={handleAddToCart} disabled={disabled || adding} aria-busy={adding}>
      {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
      {disabled ? "Out of Stock" : adding ? "Adding to cart" : "Add to Cart"}
    </Button>
  );
}
