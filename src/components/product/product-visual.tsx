import { Cable, Printer, Server, Wrench } from "lucide-react";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

const toneClasses = {
  blue: "from-slate-950 via-blue-900 to-sky-700",
  orange: "from-slate-950 via-orange-800 to-orange-500",
  slate: "from-slate-950 via-slate-700 to-slate-500",
  cyan: "from-slate-950 via-cyan-900 to-cyan-500",
  green: "from-slate-950 via-emerald-900 to-emerald-500",
  violet: "from-slate-950 via-violet-900 to-violet-500",
};

export function ProductVisual({
  product,
  className,
}: {
  product: Pick<Product, "category" | "imageTone" | "name">;
  className?: string;
}) {
  const Icon =
    product.category === "IT Support Services"
      ? Wrench
      : product.category === "Office Equipment"
        ? Server
        : product.category === "Printer Accessories" ||
            product.category === "Ink & Toners"
          ? Cable
          : Printer;

  return (
    <div
      className={cn(
        "relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-gradient-to-br p-6",
        toneClasses[product.imageTone],
        className,
      )}
      aria-label={product.name}
      role="img"
    >
      <div className="absolute inset-x-6 bottom-5 h-12 rounded-full bg-black/20 blur-xl" />
      <div className="absolute right-4 top-4 h-20 w-20 rounded-full border border-white/15" />
      <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full border border-white/10" />
      <div className="relative flex h-28 w-32 items-center justify-center rounded-md border border-white/20 bg-white/95 shadow-2xl">
        <Icon className="h-16 w-16 text-slate-900" strokeWidth={1.7} />
      </div>
    </div>
  );
}
