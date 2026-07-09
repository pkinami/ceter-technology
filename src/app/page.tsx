import Image from "next/image";
import {
  BadgeCheck,
  Headphones,
  type LucideIcon,
  PackageCheck,
  Printer,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { categories, featuredProducts } from "@/data/products";

const reasons: [string, LucideIcon][] = [
  ["Genuine products", ShieldCheck],
  ["Competitive prices", BadgeCheck],
  ["Professional support", Headphones],
  ["Fast delivery", Truck],
  ["Reliable after-sales service", PackageCheck],
];

const testimonials = [
  {
    name: "Office Manager, Nairobi",
    text: "CETER Technology helped us standardize our branch printers and reduced service interruptions.",
  },
  {
    name: "School Administrator",
    text: "Their team supplied genuine toners and supports our printers whenever issues come up.",
  },
  {
    name: "SME Business Owner",
    text: "Good pricing, quick delivery, and practical advice on which printer to buy.",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <Image
          src="/images/ceter-hero.png"
          alt="Modern office printers and technology equipment"
          fill
          priority
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/20" />
        <div className="relative mx-auto grid min-h-[680px] max-w-7xl content-center px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-orange-200 backdrop-blur">
              <Printer className="h-4 w-4" />
              CETER TECHNOLOGY
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl">
              Reliable Printing Solutions for Your Business
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200">
              Quality printers, accessories, and technology solutions for homes
              and businesses.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/products">Shop Products</ButtonLink>
              <ButtonLink href="/contact" variant="outline">
                Contact Us
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
                Browse by need
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Featured categories
              </h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((category) => (
              <div
                key={category}
                className="rounded-lg border border-slate-200 bg-slate-50 p-5 transition hover:border-orange-300 hover:bg-orange-50"
              >
                <Printer className="h-8 w-8 text-orange-500" />
                <h3 className="mt-4 font-bold text-slate-950">{category}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
                In demand
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Featured products
              </h2>
            </div>
            <ButtonLink href="/products" variant="secondary">
              View catalogue
            </ButtonLink>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
                Why choose us
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Business-friendly supply and support from one partner
              </h2>
              <p className="mt-4 text-slate-600">
                We help teams buy the right printer, keep consumables available,
                and resolve technical issues quickly.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {reasons.map(([reason, Icon]) => (
                <div key={reason} className="rounded-lg bg-slate-50 p-5">
                  <Icon className="h-7 w-7 text-orange-500" />
                  <h3 className="mt-4 font-bold text-slate-950">{reason}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black">Customer testimonials</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <figure
                key={testimonial.name}
                className="rounded-lg border border-white/10 bg-white/5 p-6"
              >
                <blockquote className="text-slate-200">
                  “{testimonial.text}”
                </blockquote>
                <figcaption className="mt-5 font-bold text-orange-300">
                  {testimonial.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-bold uppercase tracking-wide text-slate-500">
            Brands we support
          </p>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {["HP", "Canon", "Epson", "Brother", "Kyocera", "Samsung"].map(
              (brand) => (
                <div
                  key={brand}
                  className="grid h-20 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-xl font-black text-slate-700"
                >
                  {brand}
                </div>
              ),
            )}
          </div>
        </div>
      </section>
    </>
  );
}
