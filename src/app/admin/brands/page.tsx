import type { Metadata } from "next";
import { Building2, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { DeleteButton } from "../delete-button";
import { createBrand, deleteBrand, updateBrand } from "../actions";

export const metadata: Metadata = {
  title: "Brand Management",
  description: "Manage brand partners and marketplace brand metadata.",
};

export default async function BrandsPage() {
  await requirePermission("MARKETING", "MANAGE");
  const [brands, productBrands] = await Promise.all([
    prisma.brand.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.product.groupBy({ by: ["brand"], _count: { brand: true }, where: { brand: { not: "" } }, orderBy: { brand: "asc" } }),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-wide text-orange-600">Catalogue metadata</p>
        <h1 className="text-2xl font-black text-slate-950">Brands</h1>
        <p className="mt-1 text-sm text-slate-500">Brand partners shown on the storefront and product-brand coverage from the catalogue.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <form action={createBrand} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3"><Building2 className="h-5 w-5 text-orange-500" /><h2 className="text-lg font-black text-slate-950">Create brand</h2></div>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">Name<input name="name" required className="h-10 rounded-md border border-slate-300 px-3" /></label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">Logo URL<input name="logoUrl" type="url" className="h-10 rounded-md border border-slate-300 px-3" /></label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">Website<input name="website" type="url" className="h-10 rounded-md border border-slate-300 px-3" /></label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">Sort order<input name="sortOrder" type="number" defaultValue={0} className="h-10 rounded-md border border-slate-300 px-3" /></label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input name="isActive" type="checkbox" defaultChecked className="accent-orange-500" /> Active</label>
            <button className="min-h-10 rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">Create brand</button>
          </div>
        </form>

        <div className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Storefront brand partners</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {brands.map((brand) => (
                <form key={brand.id} action={updateBrand} className="rounded-md border border-slate-200 p-4">
                  <input type="hidden" name="brandId" value={brand.id} />
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">Name<input name="name" required defaultValue={brand.name} className="h-10 rounded-md border border-slate-300 px-3" /></label>
                  <label className="mt-3 grid gap-2 text-sm font-semibold text-slate-700">Logo URL<input name="logoUrl" type="url" defaultValue={brand.logoUrl ?? ""} className="h-10 rounded-md border border-slate-300 px-3" /></label>
                  <label className="mt-3 grid gap-2 text-sm font-semibold text-slate-700">Website<input name="website" type="url" defaultValue={brand.website ?? ""} className="h-10 rounded-md border border-slate-300 px-3" /></label>
                  <label className="mt-3 grid gap-2 text-sm font-semibold text-slate-700">Sort order<input name="sortOrder" type="number" defaultValue={brand.sortOrder} className="h-10 rounded-md border border-slate-300 px-3" /></label>
                  <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><input name="isActive" type="checkbox" defaultChecked={brand.isActive} className="accent-orange-500" /> Active</label>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="inline-flex min-h-10 items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"><Save className="h-4 w-4" /> Save</button>
                    <DeleteButton formAction={deleteBrand} name="brandId" value={brand.id} label={brand.name} />
                  </div>
                </form>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Catalogue brand coverage</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {productBrands.map((brand) => (
                <div key={brand.brand} className="rounded-md bg-slate-50 p-3 text-sm">
                  <p className="font-bold text-slate-950">{brand.brand}</p>
                  <p className="mt-1 text-slate-600">{brand._count.brand} product{brand._count.brand === 1 ? "" : "s"}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
