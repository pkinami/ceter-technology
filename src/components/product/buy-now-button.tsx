"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
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
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);
  const disabled = product.availability === "Out of stock";

  return (
    <Button
      className={className}
      variant="secondary"
      disabled={disabled || pending}
      aria-busy={pending}
      onClick={() => {
        if (pending || disabled) return;
        setPending(true);
        addItem(product);
        showToast({ type: "success", title: "Added to cart", message: "Opening checkout." });
        router.push("/checkout");
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
      {pending ? "Opening checkout" : "Buy now"}
    </Button>
  );
}
