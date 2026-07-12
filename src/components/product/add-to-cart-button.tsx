"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const disabled = product.availability === "Out of stock";
  function handleAddToCart() {
    addItem(product);
    void fetch("/api/analytics", {
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
  }

  return (
    <Button className={className} onClick={handleAddToCart} disabled={disabled}>
      <ShoppingCart className="h-4 w-4" />
      {disabled ? "Out of Stock" : "Add to Cart"}
    </Button>
  );
}
