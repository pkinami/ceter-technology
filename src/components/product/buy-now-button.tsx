"use client";

import { CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/types";

export function BuyNowButton({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const disabled = product.availability === "Out of stock";

  return (
    <Button
      className={className}
      variant="secondary"
      disabled={disabled}
      onClick={() => {
        addItem(product);
        router.push("/checkout");
      }}
    >
      <CreditCard className="h-4 w-4" />
      Buy now
    </Button>
  );
}
