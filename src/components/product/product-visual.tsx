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
        "relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-slate-100 p-6",
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
          className="absolute inset-0 h-full w-full object-contain p-4"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.04)_25%,transparent_25%,transparent_50%,rgba(15,23,42,0.04)_50%,rgba(15,23,42,0.04)_75%,transparent_75%,transparent)] bg-[length:24px_24px]" />
          <div className="relative flex h-28 w-32 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm">
            <Icon className="h-16 w-16 text-slate-900" strokeWidth={1.7} />
          </div>
          <span className="absolute bottom-4 text-xs font-black uppercase tracking-wide text-slate-400">CETER image pending</span>
        </>
      )}
    </div>
  );
}
