import { Eye } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductVisual } from "./product-visual";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <ProductVisual product={product} className="rounded-none" />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
            {product.subcategory}
          </p>
          <h3 className="mt-2 text-lg font-bold text-slate-950">
            {product.name}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {product.description}
          </p>
        </div>
        <div className="mt-auto flex flex-col gap-3">
          <p className="text-xl font-black text-slate-950">
            {formatCurrency(product.price)}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <AddToCartButton product={product} className="w-full" />
            <ButtonLink
              href={`/products/${product.slug}`}
              variant="outline"
              className="w-full"
            >
              <Eye className="h-4 w-4" />
              Details
            </ButtonLink>
          </div>
        </div>
      </div>
    </article>
  );
}
