import type { Metadata } from "next";
import { Building2, Mail, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { createSupplier } from "../actions";
import { formatDate, money } from "../utils";

export const metadata: Metadata = {
  title: "Supplier Management",
  description: "Supplier contacts, supplied products, pricing history, and updates.",
};

export default async function SuppliersPage() {
  await requirePermission("PRODUCTS", "EDIT");
  const suppliers = await prisma.supplier.findMany({
    include: {
      primaryProducts: { select: { id: true, name: true, price: true, updatedAt: true } },
      products: { include: { product: true }, orderBy: { updatedAt: "desc" }, take: 5 },
    },
    orderBy: { name: "asc" },
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-wide text-orange-600">Procurement</p>
        <h1 className="text-2xl font-black text-slate-950">Supplier management</h1>
        <p className="mt-1 text-sm text-slate-500">Supplier contacts, products supplied, pricing records, and last update visibility.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <form action={createSupplier} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3"><Building2 className="h-5 w-5 text-orange-500" /><h2 className="text-lg font-black text-slate-950">Create supplier</h2></div>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">Supplier name<input name="name" required className="h-10 rounded-md border border-slate-300 px-3" /></label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">Country<select name="country" defaultValue="KENYA" className="h-10 rounded-md border border-slate-300 px-3"><option value="KENYA">Kenya</option><option value="INTERNATIONAL">International</option></select></label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">Contact name<input name="contactName" className="h-10 rounded-md border border-slate-300 px-3" /></label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">Email<input name="email" type="email" className="h-10 rounded-md border border-slate-300 px-3" /></label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">Phone<input name="phone" className="h-10 rounded-md border border-slate-300 px-3" /></label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">Website<input name="website" type="url" className="h-10 rounded-md border border-slate-300 px-3" /></label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">Status<select name="status" defaultValue="ACTIVE" className="h-10 rounded-md border border-slate-300 px-3"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
            <button className="min-h-10 rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">Create supplier</button>
          </div>
        </form>

        <div className="grid gap-4">
          {suppliers.map((supplier) => (
            <article key={supplier.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">{supplier.name}</h2>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                    {supplier.email ? <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" /> {supplier.email}</span> : null}
                    {supplier.phone ? <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" /> {supplier.phone}</span> : null}
                  </div>
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{supplier.status}</span>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-500">Products supplied</p>
                  <div className="mt-2 space-y-2 text-sm">
                    {supplier.primaryProducts.map((product) => <p key={product.id} className="font-semibold text-slate-800">{product.name} - {money(product.price)}</p>)}
                    {supplier.primaryProducts.length === 0 ? <p className="text-slate-500">No primary products assigned.</p> : null}
                  </div>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-500">Pricing history</p>
                  <div className="mt-2 space-y-2 text-sm">
                    {supplier.products.map((item) => <p key={item.id} className="text-slate-700">{item.product?.name ?? item.name}: cost {money(item.costPrice)} - updated {formatDate(item.updatedAt)}</p>)}
                    {supplier.products.length === 0 ? <p className="text-slate-500">No supplier price records yet.</p> : null}
                  </div>
                </div>
              </div>
            </article>
          ))}
          {suppliers.length === 0 ? <p className="rounded-md bg-white p-6 text-sm text-slate-500 shadow-sm">No suppliers yet.</p> : null}
        </div>
      </div>
    </section>
  );
}
