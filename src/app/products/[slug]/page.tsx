import type { Metadata } from "next";
import { MessageCircle, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { ProductVisual } from "@/components/product/product-visual";
import { ButtonLink } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { getProductBySlug, products } from "@/data/products";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: "Product not found" };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailsPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const whatsappText = encodeURIComponent(
    `Hello CETER Technology, I would like to order ${product.name}.`,
  );

  return (
    <div className="bg-white">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <ProductVisual product={product} className="lg:sticky lg:top-28" />
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
            {product.category} / {product.subcategory}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-normal text-slate-950">
            {product.name}
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            {product.longDescription}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <p className="text-3xl font-black text-slate-950">
              {formatCurrency(product.price)}
            </p>
            <span className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
              {product.availability} · {product.stock} available
            </span>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <AddToCartButton product={product} className="sm:w-fit" />
            <ButtonLink
              href={`https://wa.me/254700000000?text=${whatsappText}`}
              variant="secondary"
              className="sm:w-fit"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Order
            </ButtonLink>
          </div>

          <section className="mt-10">
            <h2 className="text-xl font-black text-slate-950">
              Technical specifications
            </h2>
            <dl className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="grid gap-1 p-4 sm:grid-cols-3">
                  <dt className="font-semibold text-slate-700">{key}</dt>
                  <dd className="sm:col-span-2 text-slate-600">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-black text-slate-950">
              Customer reviews
            </h2>
            <div className="mt-4 grid gap-4">
              {product.reviews.map((review) => (
                <figure
                  key={review.name}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex gap-1 text-orange-500">
                    {Array.from({ length: review.rating }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-3 text-slate-700">
                    “{review.comment}”
                  </blockquote>
                  <figcaption className="mt-3 text-sm font-bold text-slate-950">
                    {review.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
