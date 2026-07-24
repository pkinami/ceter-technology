import { Eye, MessageCircle, Tag } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { productOrderMessage, whatsappUrl } from "@/lib/whatsapp";
import type { Product } from "@/types";
import { AddToCartButton } from "./add-to-cart-button";
import { BuyNowButton } from "./buy-now-button";
import { ProductVisual } from "./product-visual";

export function ProductCard({ product }: { product: Product }) {
  const salePrice = product.discountPrice ?? product.price;
  const savings = product.discountPrice ? product.price - product.discountPrice : 0;
  const primaryBadge = product.badges[0]?.replaceAll("_", " ") ?? null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg">
      <div className="relative">
        <ProductVisual product={product} className="rounded-none" />
        {primaryBadge ? (
          <span className="absolute left-3 top-3 rounded bg-orange-500 px-2 py-1 text-[11px] font-black uppercase text-white shadow-sm">
            {primaryBadge}
          </span>
        ) : null}
        {savings > 0 ? (
          <span className="absolute right-3 top-3 rounded bg-emerald-600 px-2 py-1 text-[11px] font-black uppercase text-white shadow-sm">
            Save {formatCurrency(savings)}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="line-clamp-1 text-xs font-black uppercase text-orange-700">
              {product.subcategory}
            </p>
            {product.brand ? <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-700">{product.brand}</span> : null}
          </div>
          <h3 className="mt-2 line-clamp-2 min-h-11 text-[15px] font-black leading-5 text-slate-950">
            {product.name}
          </h3>
        </div>
        <div className="mt-auto flex flex-col gap-3">
          <div>
            <p className="text-xl font-black leading-none text-slate-950">
              {formatCurrency(salePrice)}
            </p>
            {product.discountPrice ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-400 line-through">
                  {formatCurrency(product.price)}
                </p>
                <p className="inline-flex items-center gap-1 text-xs font-black text-emerald-700">
                  <Tag className="h-3 w-3" />
                  {formatCurrency(savings)} off
                </p>
              </div>
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
          <div className="grid grid-cols-2 gap-2">
            <AddToCartButton product={product} className="w-full" />
            <BuyNowButton product={product} className="w-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ButtonLink
              href={`/products/${product.slug}`}
              variant="outline"
              className="w-full"
            >
              <Eye className="h-4 w-4" />
              Details
            </ButtonLink>
            <ButtonLink href={whatsappUrl(productOrderMessage(product))} variant="ghost" className="w-full border border-slate-200">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </ButtonLink>
          </div>
        </div>
      </div>
    </article>
  );
}
