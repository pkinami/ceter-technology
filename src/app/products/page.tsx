import type { Metadata } from "next";
import { ProductFilters } from "@/components/product/product-filters";
import { categoryGroups, products } from "@/data/products";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse printers, ink cartridges, toners, printer accessories, scanners, UPS systems, and office equipment.",
};

export default function ProductsPage() {
  return (
    <div className="bg-slate-50">
      <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-wide text-orange-300">
            Product catalogue
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-normal">
            Printers, accessories, and office technology
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Search, filter, and compare reliable equipment for business and
            home office use.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {Object.entries(categoryGroups).map(([group, items]) => (
            <div key={group} className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-950">{group}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {items.join(", ")}
              </p>
            </div>
          ))}
        </div>
        <ProductFilters products={products} />
      </section>
    </div>
  );
}
