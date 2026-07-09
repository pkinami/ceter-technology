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

  return (
    <Button className={className} onClick={() => addItem(product)}>
      <ShoppingCart className="h-4 w-4" />
      Add to Cart
    </Button>
  );
}
