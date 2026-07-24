import type { Metadata } from "next";
import Link from "next/link";
import { after, connection } from "next/server";
import { ChevronRight, Home, PackageCheck, ShieldCheck, Truck, Wrench } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { ProductCard } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { trackProductView } from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/catalog";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product not found" };
  }

  const description =
    product.description ||
    `Buy genuine ${product.brand || product.name} from CETER Technology with delivery and support.`;

  return {
    title: product.name,
    description,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    keywords: [
      product.name,
      product.brand,
      product.category,
      product.subcategory,
      "CETER Technology",
      "Kenya technology supplier",
    ].filter((item): item is string => Boolean(item)),
    openGraph: {
      title: product.name,
      description,
      type: "website",
      url: `/products/${product.slug}`,
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
  };
}

export default async function ProductDetailsPage({ params }: Props) {
  await connection();

  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product);
  const user = await getCurrentUser();
  after(async () => {
    await trackProductView({
      productId: product.id,
      userId: user?.id ?? null,
      metadata: { productId: product.id, slug: product.slug, name: product.name },
    });
  });
  const salePrice = product.discountPrice ?? product.price;
  const savings = product.discountPrice ? product.price - product.discountPrice : 0;
  const expensiveEquipment = salePrice >= 50000;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: {
      "@type": "Brand",
      name: product.brand || "CETER Technology",
    },
    image: product.images,
    sku: product.sku ?? product.slug,
    offers: {
      "@type": "Offer",
      priceCurrency: "KES",
      price: salePrice,
      availability:
        product.availability === "Out of stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      url: `https://cetertechnology.com/products/${product.slug}`,
    },
  };

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="lg:sticky lg:top-36 lg:self-start">
          <ProductGallery product={product} />
        </div>
        <div>
          <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
            <Link href="/" className="inline-flex items-center gap-1 hover:text-orange-600">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/products" className="hover:text-orange-600">Products</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-orange-600">{product.category}</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900">{product.name}</span>
          </nav>
          <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
            {product.categoryPath}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-normal text-slate-950">
            {product.name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold text-slate-600">
            {product.brand ? <span className="rounded-md bg-slate-100 px-3 py-2">Brand: {product.brand}</span> : null}
            <span className="rounded-md bg-slate-100 px-3 py-2">SKU: {product.sku ?? product.slug}</span>
          </div>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            {product.description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div>
              <p className="text-3xl font-black text-slate-950">
                {formatCurrency(salePrice)}
              </p>
              {product.discountPrice ? (
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <p className="font-semibold text-slate-400 line-through">
                    {formatCurrency(product.price)}
                  </p>
                  <p className="rounded-md bg-emerald-50 px-2 py-1 text-sm font-black text-emerald-700">
                    Save {formatCurrency(savings)}
                  </p>
                </div>
              ) : null}
            </div>
            <span
              className={
                product.availability === "Out of stock"
                  ? "rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700"
                  : "rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700"
              }
            >
              {product.availability} - {product.stock} available
            </span>
          </div>
          <div className="mt-8 rounded-md border border-slate-200 bg-slate-50 p-5">
            <ProductPurchasePanel product={product} />
          </div>
          {expensiveEquipment ? (
            <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <p className="font-black text-orange-950">Quotation recommended for this equipment</p>
              <p className="mt-1 text-sm text-orange-900/80">
                Ask CETER Technology to confirm warranty terms, installation scope, delivery charges, and any reliable consumable matches before purchase.
              </p>
              <ButtonLink href={`/#request-quote`} variant="secondary" className="mt-3 w-fit">
                Request formal quote
              </ButtonLink>
            </div>
          ) : null}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              [PackageCheck, product.availability],
              [ShieldCheck, "Warranty terms confirmed before dispatch"],
              [Truck, "Delivery cost and schedule confirmed"],
              [Wrench, "Installation or maintenance on request"],
            ].map(([Icon, label]) => {
              const ItemIcon = Icon as typeof PackageCheck;

              return (
                <div key={label as string} className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                  <ItemIcon className="h-5 w-5 text-orange-500" />
                  {label as string}
                </div>
              );
            })}
          </div>

          <section className="mt-10 grid gap-5">
            <div>
              <h2 className="text-xl font-black text-slate-950">Overview</h2>
              <p className="mt-3 leading-7 text-slate-600">{product.description}</p>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">Categories</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {[product.category, product.subcategory].filter(Boolean).map((item) => (
                  <Link key={item} href={`/products?category=${encodeURIComponent(item)}`} className="rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-700">
                    {item}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">Compatible consumables</h2>
              <p className="mt-3 leading-7 text-slate-600">
                Reliable compatibility data is not inferred automatically. Search by the exact model, toner number, cartridge number, brand, or SKU, or request confirmation before dispatch.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Toner", "Ink cartridge", "Printer cable", "UPS", product.brand].filter(Boolean).map((item) => (
                  <Link key={item} href={`/products?q=${encodeURIComponent(item)}`} className="rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-700">
                    {item}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">Recently viewed</h2>
              <p className="mt-3 leading-7 text-slate-600">
                This item has been recorded in product view analytics for authenticated customers and catalogue reporting.
              </p>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-black text-slate-950">
              Technical specifications
            </h2>
            <dl className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200">
              {Object.entries(product.specs).length > 0 ? (
                Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="grid gap-1 p-4 sm:grid-cols-3">
                    <dt className="font-semibold text-slate-700">{key}</dt>
                    <dd className="text-slate-600 sm:col-span-2">{value}</dd>
                  </div>
                ))
              ) : (
                <div className="p-4 text-slate-600">
                  Contact CETER Technology for detailed specifications.
                </div>
              )}
            </dl>
          </section>
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="bg-slate-50 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-black text-slate-950">
              Related products
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
