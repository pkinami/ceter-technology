import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  ChevronRight,
  Headphones,
  MessageCircle,
  Search,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { submitQuoteRequest } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { marketplaceDepartments, marketplaceHighlights } from "@/lib/marketplace";
import { getPublicProductShelf } from "@/lib/catalog";

const defaultHero = {
  title: "CETER Technology Marketplace",
  subtitle:
    "Printers, genuine consumables, office equipment, computers, networking, CCTV, power backup, and ICT services for homes, schools, offices, and organizations.",
  imageUrl: "/images/ceter-hero.png",
  primaryLabel: "Shop catalogue",
  primaryLink: "/products",
  secondaryLabel: "Request a quote",
  secondaryLink: "#request-quote",
};

const fallbackPromotions = [
  {
    title: "Printer fleet upgrade",
    description: "Business-ready laser and multifunction printers with setup, consumables, and support options.",
    ctaLabel: "Shop printers",
    ctaLink: "/products?category=Printers",
  },
  {
    title: "Genuine toner and ink",
    description: "Find toner numbers, cartridge numbers, and compatible supplies for supported printer models.",
    ctaLabel: "Find consumables",
    ctaLink: "/products?q=toner",
  },
  {
    title: "School and office ICT packages",
    description: "Computers, networking, UPS, printers, CCTV, installation, and maintenance contracts.",
    ctaLabel: "Request package",
    ctaLink: "#request-quote",
  },
];

const solutionTiles = [
  ["Printers", "Laser, inkjet, multifunction, photo, label, and large format printers.", "/products?category=Printers"],
  ["Toner & Ink", "Toners, cartridges, bottles, printer parts, paper, and accessories.", "/products?q=toner"],
  ["Office Equipment", "Photocopiers, scanners, laminators, binders, shredders, and office tools.", "/products?category=Office%20Equipment"],
  ["Computers", "HP, Dell, Lenovo, Asus, Acer, desktops, workstations, and servers.", "/products?category=Computers%20%26%20Laptops"],
  ["Networking", "Routers, switches, access points, WiFi extenders, and structured cabling.", "/products?category=Networking%20Equipment"],
  ["Security Systems", "CCTV cameras, DVR/NVR, access control, biometrics, and installation.", "/products?category=Security%20Systems"],
  ["Power Solutions", "UPS systems, surge protection, inverters, and power cables.", "/products?category=Power%20Solutions"],
  ["ICT Services", "Network installation, IT support, cloud services, backup, and maintenance.", "/services"],
] as const;

function productShelf(products: Awaited<ReturnType<typeof getPublicProductShelf>>, terms: string[], fallbackCount = 4) {
  const matches = products.filter((product) => {
    const haystack = `${product.name} ${product.brand} ${product.category} ${product.subcategory} ${product.description}`.toLowerCase();

    return terms.some((term) => haystack.includes(term));
  });

  return (matches.length > 0 ? matches : products).slice(0, fallbackCount);
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();
  const [products, banners, promotions, testimonials] = await Promise.all([
    getPublicProductShelf(120),
    prisma.homepageBanner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 1,
    }),
    prisma.promotion.findMany({
      where: {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 3,
    }),
    prisma.testimonial.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 3,
    }),
  ]);

  const hero = banners[0] ?? defaultHero;
  const printerProducts = productShelf(products, ["printer", "laser", "inkjet", "multifunction", "photocopier"]);
  const consumables = productShelf(products, ["toner", "ink", "cartridge", "bottle", "drum"]);
  const computers = productShelf(products, ["laptop", "desktop", "computer", "workstation", "server"]);
  const networking = productShelf(products, ["router", "switch", "access point", "wifi", "cctv", "ups"]);
  const activePromotions = promotions.length > 0 ? promotions : fallbackPromotions;

  return (
    <div className="bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <Image src={hero.imageUrl ?? "/images/ceter-hero.png"} alt="" fill priority sizes="100vw" className="object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/40" />
        </div>
        <div className="relative mx-auto grid min-h-[620px] max-w-7xl content-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-black text-orange-200">
              <ShieldCheck className="h-4 w-4" />
              Genuine business technology supply
            </p>
            <h1 className="mt-6 text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl">
              {hero.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">{hero.subtitle}</p>
            <form action="/products" className="mt-8 max-w-3xl rounded-lg border border-white/10 bg-white p-2 shadow-2xl">
              <label className="relative block">
                <span className="sr-only">Search products</span>
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  name="q"
                  placeholder="Search by product, printer model, toner number, cartridge number, brand, or SKU"
                  className="h-12 w-full rounded-md border-0 pl-11 pr-32 text-sm font-semibold text-slate-950"
                />
                <button className="absolute right-1 top-1/2 h-10 -translate-y-1/2 rounded-md bg-orange-500 px-4 text-sm font-black text-white hover:bg-orange-600">
                  Search
                </button>
              </label>
            </form>
            <div className="mt-5 flex flex-wrap gap-2">
              {["HP toner", "Multifunction printer", "UPS", "CCTV", "Dell laptop"].map((item) => (
                <Link key={item} href={`/products?q=${encodeURIComponent(item)}`} className="rounded-md bg-white/10 px-3 py-2 text-sm font-bold text-slate-100 hover:bg-white/20">
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-4">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {marketplaceHighlights.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="flex items-center gap-3 rounded-md bg-slate-50 p-4 text-sm font-black text-slate-800">
                <Icon className="h-5 w-5 text-orange-500" />
                {item.label}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {solutionTiles.map(([title, description, href]) => (
            <Link key={title} href={href} className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-950">{title}</h2>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-orange-600" />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-orange-600">Printer deals</p>
              <h2 className="mt-1 text-3xl font-black text-slate-950">Best-selling printers and photocopiers</h2>
            </div>
            <ButtonLink href="/products?category=Printers" variant="outline">View all printers</ButtonLink>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {printerProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            {activePromotions.map((promotion) => (
              <Link key={promotion.title} href={promotion.ctaLink} className="rounded-lg border border-orange-200 bg-orange-50 p-6 shadow-sm hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
                <p className="text-xs font-black uppercase tracking-wide text-orange-700">Promotion</p>
                <h3 className="mt-2 text-xl font-black text-slate-950">{promotion.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">{promotion.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-orange-700">
                  {promotion.ctaLabel}
                  <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {[
        ["Toner, ink, and printer accessories", "Find consumables by printer brand, model, toner number, or cartridge number.", consumables, "/products?q=toner"],
        ["Computers and office workstations", "Laptops, desktops, monitors, servers, and business accessories.", computers, "/products?category=Computers%20%26%20Laptops"],
        ["Networking, power, and security", "Routers, switches, WiFi, CCTV, access control, UPS, and installation supplies.", networking, "/products?category=Networking%20Equipment"],
      ].map(([title, subtitle, shelf, href]) => (
        <section key={title as string} className="bg-white py-12 even:bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <h2 className="text-2xl font-black text-slate-950">{title as string}</h2>
                <p className="mt-2 text-sm text-slate-600">{subtitle as string}</p>
              </div>
              <ButtonLink href={href as string} variant="outline">Shop section</ButtonLink>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {(shelf as typeof products).map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </div>
        </section>
      ))}

      <section className="bg-slate-950 py-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-orange-300">CETER departments</p>
            <h2 className="mt-2 text-3xl font-black">Organized for quick procurement</h2>
            <p className="mt-4 text-slate-300">Browse a serious technology catalogue without losing the ability to ask for guidance, compatibility checks, installation, or a formal quote.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {marketplaceDepartments.map((department) => {
              const Icon = department.icon;

              return (
                <Link key={department.name} href={department.href} className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 p-4 font-bold hover:bg-white/10">
                  <Icon className="h-5 w-5 text-orange-300" />
                  {department.name}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="request-quote" className="bg-white py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-orange-600">Quotation desk</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Need expensive equipment, bulk supply, or a service contract?</h2>
            <p className="mt-4 text-slate-600">Send the model, quantity, installation location, or compatibility question. The team can respond with pricing, warranty, and delivery details.</p>
            <div className="mt-6 grid gap-3">
              {[
                [MessageCircle, "WhatsApp ordering available"],
                [Truck, "Delivery information confirmed before dispatch"],
                [Wrench, "Maintenance and installation options"],
                [Headphones, "Support for schools, offices, and organizations"],
              ].map(([Icon, label]) => {
                const ItemIcon = Icon as typeof MessageCircle;

                return (
                  <div key={label as string} className="flex items-center gap-3 rounded-md bg-slate-50 p-4 text-sm font-bold text-slate-700">
                    <ItemIcon className="h-5 w-5 text-orange-500" />
                    {label as string}
                  </div>
                );
              })}
            </div>
          </div>
          <form action={submitQuoteRequest} className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="name" required placeholder="Name" className="rounded-md border border-slate-300 bg-white px-3 py-3" />
              <input name="company" placeholder="Company or organization" className="rounded-md border border-slate-300 bg-white px-3 py-3" />
              <input name="phone" required placeholder="Phone" className="rounded-md border border-slate-300 bg-white px-3 py-3" />
              <input name="email" type="email" required placeholder="Email" className="rounded-md border border-slate-300 bg-white px-3 py-3" />
            </div>
            <input name="productInterest" placeholder="Product, printer model, toner number, or service needed" className="rounded-md border border-slate-300 bg-white px-3 py-3" />
            <textarea name="message" required rows={5} placeholder="Quantity, delivery location, compatibility needs, or project details" className="rounded-md border border-slate-300 bg-white px-3 py-3" />
            <button className="inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-orange-500 px-4 py-2 text-sm font-black text-white hover:bg-orange-600">
              Submit quote request
            </button>
          </form>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          {[
            [BadgeCheck, "Genuine products and consumables"],
            [ShieldCheck, "Warranty and technical guidance"],
            [Truck, "Delivery and installation coordination"],
          ].map(([Icon, label]) => {
            const ItemIcon = Icon as typeof BadgeCheck;

            return (
              <div key={label as string} className="flex items-center gap-3 rounded-lg bg-slate-50 p-5 font-black text-slate-800">
                <ItemIcon className="h-6 w-6 text-orange-500" />
                {label as string}
              </div>
            );
          })}
        </div>
      </section>

      {testimonials.length > 0 ? (
        <section className="bg-slate-50 py-12">
          <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
            {testimonials.map((testimonial) => (
              <figure key={testimonial.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <blockquote className="text-sm leading-6 text-slate-600">&quot;{testimonial.review}&quot;</blockquote>
                <figcaption className="mt-5 font-black text-slate-950">
                  {testimonial.customer}
                  {testimonial.company ? <span className="block text-sm font-semibold text-slate-500">{testimonial.company}</span> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
