import Image from "next/image";
import { Cable, Printer, Server } from "lucide-react";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

export function ProductVisual({
  product,
  className,
}: {
  product: Pick<Product, "category" | "imageUrl" | "name">;
  className?: string;
}) {
  const Icon =
    product.category === "Office Equipment"
        ? Server
        : product.category === "Printer Accessories"
          ? Cable
          : Printer;

  return (
    <div
      className={cn(
        "relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-slate-950 via-blue-950 to-orange-500 p-6",
        className,
      )}
      aria-label={product.name}
      role="img"
    >
      {product.imageUrl ? (
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.10)_50%,rgba(255,255,255,0.10)_75%,transparent_75%,transparent)] bg-[length:24px_24px] opacity-20" />
          <div className="absolute inset-x-8 bottom-8 h-px bg-white/30" />
          <div className="absolute inset-x-14 bottom-12 h-px bg-white/20" />
          <div className="relative flex h-28 w-32 items-center justify-center rounded-md border border-white/20 bg-white/95 shadow-2xl">
            <Icon className="h-16 w-16 text-slate-900" strokeWidth={1.7} />
          </div>
        </>
      )}
    </div>
  );
}
