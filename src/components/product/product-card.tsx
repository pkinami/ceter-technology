import { Eye, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { productOrderMessage, whatsappUrl } from "@/lib/whatsapp";
import type { Product } from "@/types";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductVisual } from "./product-visual";

export function ProductCard({ product }: { product: Product }) {
  const specs = Object.entries(product.specs).slice(0, 2);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg">
      <ProductVisual product={product} className="rounded-none" />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
              {product.brand || "CETER"} / {product.subcategory}
            </p>
            {product.badges.slice(0, 1).map((badge) => (
              <span key={badge} className="rounded bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-700">
                {badge.replaceAll("_", " ")}
              </span>
            ))}
          </div>
          <h3 className="mt-2 line-clamp-2 min-h-14 text-lg font-bold text-slate-950">
            {product.name}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
            {product.description}
          </p>
          {specs.length > 0 ? (
            <dl className="mt-3 grid gap-1 rounded-md bg-slate-50 p-3 text-xs">
              {specs.map(([key, value]) => (
                <div key={key} className="flex justify-between gap-3">
                  <dt className="font-bold text-slate-500">{key}</dt>
                  <dd className="text-right font-semibold text-slate-700">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
        <div className="mt-auto flex flex-col gap-3">
          <div>
            <p className="text-xl font-black text-slate-950">
              {formatCurrency(product.discountPrice ?? product.price)}
            </p>
            {product.discountPrice ? (
              <p className="text-sm font-semibold text-slate-400 line-through">
                {formatCurrency(product.price)}
              </p>
            ) : null}
          </div>
          <span
            className={
              product.availability === "Out of stock"
                ? "w-fit rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-700"
                : "w-fit rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700"
            }
          >
            {product.availability}
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Warranty
            </span>
            <span className="inline-flex items-center gap-1">
              <Truck className="h-3.5 w-3.5 text-orange-500" />
              Delivery
            </span>
          </div>
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
          <ButtonLink href={whatsappUrl(productOrderMessage(product))} variant="ghost" className="w-full border border-slate-200">
            <MessageCircle className="h-4 w-4" />
            WhatsApp quote
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
