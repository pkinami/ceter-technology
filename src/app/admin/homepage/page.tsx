import type { Metadata } from "next";
import { Building2, ImageIcon, Megaphone, MessageSquareQuote, ShieldCheck, Star, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "../utils";
import {
  createBrand,
  createHomepageBanner,
  createIndustrySolution,
  createPromotion,
  createService,
  createTestimonial,
  updateBrand,
  updateHomepageBanner,
  updateIndustrySolution,
  updatePromotion,
  updateQuoteRequestStatus,
  updateService,
  updateTestimonial,
} from "../actions";

export const metadata: Metadata = {
  title: "Homepage Management",
  description: "Manage CETER Technology homepage banners, promotions, brands, services, testimonials, and quote requests.",
};

export const dynamic = "force-dynamic";

function dateValue(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}

const inputClass = "rounded-md border border-slate-300 px-3 py-2";
const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800";
const panelClass = "rounded-lg border border-slate-200 bg-white p-6 shadow-sm";

export default async function AdminHomepagePage() {
  const [banners, promotions, brands, solutions, services, testimonials, quoteRequests] = await Promise.all([
    prisma.homepageBanner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    prisma.promotion.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    prisma.brand.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.industrySolution.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    prisma.service.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    prisma.testimonial.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    prisma.quoteRequest.findMany({
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-wide text-orange-600">Website merchandising</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">Homepage management</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Control the supplier-style homepage sections: hero banners, campaigns, brand partners, industry solutions, services, testimonials, and quote requests.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className={panelClass}>
            <div className="flex items-center gap-3">
              <ImageIcon className="h-6 w-6 text-orange-500" />
              <h3 className="text-xl font-black text-slate-950">Create hero banner</h3>
            </div>
            <form action={createHomepageBanner} className="mt-5 grid gap-4">
              <Field label="Title">
                <input name="title" required defaultValue="Complete Printing & Technology Solutions" className={inputClass} />
              </Field>
              <Field label="Subtitle">
                <textarea name="subtitle" required rows={3} defaultValue="Printers, photocopiers, IT equipment, networking and business solutions from trusted global brands." className={inputClass} />
              </Field>
              <Field label="Upload banner image">
                <input name="image" type="file" accept="image/*" className={inputClass} />
              </Field>
              <Field label="Or image URL">
                <input name="imageUrl" placeholder="/images/ceter-hero.png" className={inputClass} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Primary label">
                  <input name="primaryLabel" defaultValue="Shop Products" className={inputClass} />
                </Field>
                <Field label="Primary link">
                  <input name="primaryLink" defaultValue="/products" className={inputClass} />
                </Field>
                <Field label="Secondary label">
                  <input name="secondaryLabel" defaultValue="Request a Quote" className={inputClass} />
                </Field>
                <Field label="Secondary link">
                  <input name="secondaryLink" defaultValue="#request-quote" className={inputClass} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sort order">
                  <input name="sortOrder" type="number" defaultValue={0} className={inputClass} />
                </Field>
                <label className="flex items-center gap-2 self-end text-sm font-semibold text-slate-700">
                  <input name="isActive" type="checkbox" defaultChecked className="accent-orange-500" />
                  Active
                </label>
              </div>
              <button className={buttonClass}>Create banner</button>
            </form>
          </div>

          <div className={panelClass}>
            <div className="flex items-center gap-3">
              <Megaphone className="h-6 w-6 text-orange-500" />
              <h3 className="text-xl font-black text-slate-950">Create promotion</h3>
            </div>
            <form action={createPromotion} className="mt-5 grid gap-4">
              <Field label="Campaign title">
                <input name="title" required placeholder="Office Printer Upgrade Offer" className={inputClass} />
              </Field>
              <Field label="Description">
                <textarea name="description" rows={3} className={inputClass} />
              </Field>
              <Field label="Upload banner">
                <input name="image" type="file" accept="image/*" className={inputClass} />
              </Field>
              <Field label="Or image URL">
                <input name="imageUrl" className={inputClass} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Start date">
                  <input name="startsAt" type="date" className={inputClass} />
                </Field>
                <Field label="End date">
                  <input name="endsAt" type="date" className={inputClass} />
                </Field>
                <Field label="Button label">
                  <input name="ctaLabel" defaultValue="View offer" className={inputClass} />
                </Field>
                <Field label="Button link">
                  <input name="ctaLink" defaultValue="/products" className={inputClass} />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input name="isActive" type="checkbox" defaultChecked className="accent-orange-500" />
                Enabled
              </label>
              <button className={buttonClass}>Create promotion</button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className={panelClass}>
            <h3 className="text-xl font-black text-slate-950">Active hero banners</h3>
            <div className="mt-5 grid gap-4">
              {banners.map((banner) => (
                <form key={banner.id} action={updateHomepageBanner} className="grid gap-3 rounded-md border border-slate-200 p-4">
                  <input type="hidden" name="bannerId" value={banner.id} />
                  <input name="title" required defaultValue={banner.title} className={inputClass} />
                  <textarea name="subtitle" required defaultValue={banner.subtitle} rows={2} className={inputClass} />
                  <input name="imageUrl" defaultValue={banner.imageUrl ?? ""} placeholder="Image URL" className={inputClass} />
                  <input name="image" type="file" accept="image/*" className={inputClass} />
                  <div className="grid gap-3 md:grid-cols-4">
                    <input name="primaryLabel" defaultValue={banner.primaryLabel} className={inputClass} />
                    <input name="primaryLink" defaultValue={banner.primaryLink} className={inputClass} />
                    <input name="secondaryLabel" defaultValue={banner.secondaryLabel} className={inputClass} />
                    <input name="secondaryLink" defaultValue={banner.secondaryLink} className={inputClass} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <input name="sortOrder" type="number" defaultValue={banner.sortOrder} className={`${inputClass} w-28`} />
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input name="isActive" type="checkbox" defaultChecked={banner.isActive} className="accent-orange-500" />
                      Active
                    </label>
                    <button className={buttonClass}>Update</button>
                  </div>
                </form>
              ))}
              {banners.length === 0 ? <p className="text-sm text-slate-500">No custom banners yet. The homepage uses a professional default hero.</p> : null}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className={panelClass}>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-orange-500" />
                <h3 className="text-xl font-black text-slate-950">Brand partners</h3>
              </div>
              <form action={createBrand} className="mt-5 grid gap-3">
                <input name="name" required placeholder="HP" className={inputClass} />
                <input name="logoUrl" placeholder="Logo URL" className={inputClass} />
                <input name="logo" type="file" accept="image/*" className={inputClass} />
                <input name="website" placeholder="Website" className={inputClass} />
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input name="isActive" type="checkbox" defaultChecked className="accent-orange-500" />
                  Active
                </label>
                <button className={buttonClass}>Add brand</button>
              </form>
              <div className="mt-5 grid gap-3">
                {brands.map((brand) => (
                  <form key={brand.id} action={updateBrand} className="grid gap-2 rounded-md bg-slate-50 p-3">
                    <input type="hidden" name="brandId" value={brand.id} />
                    <input name="name" required defaultValue={brand.name} className={inputClass} />
                    <input name="logoUrl" defaultValue={brand.logoUrl ?? ""} className={inputClass} />
                    <input name="logo" type="file" accept="image/*" className={inputClass} />
                    <input name="website" defaultValue={brand.website ?? ""} className={inputClass} />
                    <div className="flex items-center justify-between gap-3">
                      <input name="sortOrder" type="number" defaultValue={brand.sortOrder} className={`${inputClass} w-24`} />
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input name="isActive" type="checkbox" defaultChecked={brand.isActive} className="accent-orange-500" />
                        Active
                      </label>
                      <button className={buttonClass}>Save</button>
                    </div>
                  </form>
                ))}
              </div>
            </div>

            <div className={panelClass}>
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-orange-500" />
                <h3 className="text-xl font-black text-slate-950">Industry solutions</h3>
              </div>
              <form action={createIndustrySolution} className="mt-5 grid gap-3">
                <input name="title" required placeholder="Corporate Offices" className={inputClass} />
                <textarea name="description" required rows={3} className={inputClass} />
                <input name="imageUrl" placeholder="Image URL" className={inputClass} />
                <input name="image" type="file" accept="image/*" className={inputClass} />
                <input name="ctaLink" defaultValue="/services" className={inputClass} />
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input name="isActive" type="checkbox" defaultChecked className="accent-orange-500" />
                  Active
                </label>
                <button className={buttonClass}>Add solution</button>
              </form>
              <div className="mt-5 grid gap-3">
                {solutions.map((solution) => (
                  <form key={solution.id} action={updateIndustrySolution} className="grid gap-2 rounded-md bg-slate-50 p-3">
                    <input type="hidden" name="solutionId" value={solution.id} />
                    <input name="title" required defaultValue={solution.title} className={inputClass} />
                    <textarea name="description" required defaultValue={solution.description} rows={2} className={inputClass} />
                    <input name="imageUrl" defaultValue={solution.imageUrl ?? ""} className={inputClass} />
                    <input name="image" type="file" accept="image/*" className={inputClass} />
                    <input name="ctaLabel" defaultValue={solution.ctaLabel} className={inputClass} />
                    <input name="ctaLink" defaultValue={solution.ctaLink} className={inputClass} />
                    <div className="flex items-center justify-between gap-3">
                      <input name="sortOrder" type="number" defaultValue={solution.sortOrder} className={`${inputClass} w-24`} />
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input name="isActive" type="checkbox" defaultChecked={solution.isActive} className="accent-orange-500" />
                        Active
                      </label>
                      <button className={buttonClass}>Save</button>
                    </div>
                  </form>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className={panelClass}>
              <div className="flex items-center gap-3">
                <Wrench className="h-6 w-6 text-orange-500" />
                <h3 className="text-xl font-black text-slate-950">Services</h3>
              </div>
              <form action={createService} className="mt-5 grid gap-3">
                <input name="title" required placeholder="Printer Maintenance" className={inputClass} />
                <textarea name="description" required rows={3} className={inputClass} />
                <input name="icon" placeholder="printer" className={inputClass} />
                <input name="ctaLink" defaultValue="/services" className={inputClass} />
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input name="isActive" type="checkbox" defaultChecked className="accent-orange-500" />
                  Active
                </label>
                <button className={buttonClass}>Add service</button>
              </form>
              <div className="mt-5 grid gap-3">
                {services.map((service) => (
                  <form key={service.id} action={updateService} className="grid gap-2 rounded-md bg-slate-50 p-3">
                    <input type="hidden" name="serviceId" value={service.id} />
                    <input name="title" required defaultValue={service.title} className={inputClass} />
                    <textarea name="description" required defaultValue={service.description} rows={2} className={inputClass} />
                    <input name="icon" defaultValue={service.icon ?? ""} className={inputClass} />
                    <input name="ctaLink" defaultValue={service.ctaLink} className={inputClass} />
                    <div className="flex items-center justify-between gap-3">
                      <input name="sortOrder" type="number" defaultValue={service.sortOrder} className={`${inputClass} w-24`} />
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input name="isActive" type="checkbox" defaultChecked={service.isActive} className="accent-orange-500" />
                        Active
                      </label>
                      <button className={buttonClass}>Save</button>
                    </div>
                  </form>
                ))}
              </div>
            </div>

            <div className={panelClass}>
              <div className="flex items-center gap-3">
                <Star className="h-6 w-6 text-orange-500" />
                <h3 className="text-xl font-black text-slate-950">Testimonials</h3>
              </div>
              <form action={createTestimonial} className="mt-5 grid gap-3">
                <input name="customer" required placeholder="Customer name" className={inputClass} />
                <input name="company" placeholder="Company" className={inputClass} />
                <textarea name="review" required rows={3} className={inputClass} />
                <input name="rating" type="number" min={1} max={5} defaultValue={5} className={inputClass} />
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input name="isActive" type="checkbox" defaultChecked className="accent-orange-500" />
                  Active
                </label>
                <button className={buttonClass}>Add testimonial</button>
              </form>
              <div className="mt-5 grid gap-3">
                {testimonials.map((testimonial) => (
                  <form key={testimonial.id} action={updateTestimonial} className="grid gap-2 rounded-md bg-slate-50 p-3">
                    <input type="hidden" name="testimonialId" value={testimonial.id} />
                    <input name="customer" required defaultValue={testimonial.customer} className={inputClass} />
                    <input name="company" defaultValue={testimonial.company ?? ""} className={inputClass} />
                    <textarea name="review" required defaultValue={testimonial.review} rows={2} className={inputClass} />
                    <div className="flex items-center justify-between gap-3">
                      <input name="rating" type="number" min={1} max={5} defaultValue={testimonial.rating} className={`${inputClass} w-20`} />
                      <input name="sortOrder" type="number" defaultValue={testimonial.sortOrder} className={`${inputClass} w-24`} />
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input name="isActive" type="checkbox" defaultChecked={testimonial.isActive} className="accent-orange-500" />
                        Active
                      </label>
                      <button className={buttonClass}>Save</button>
                    </div>
                  </form>
                ))}
              </div>
            </div>
          </div>

          <div className={panelClass}>
            <div className="flex items-center gap-3">
              <MessageSquareQuote className="h-6 w-6 text-orange-500" />
              <h3 className="text-xl font-black text-slate-950">Quote requests</h3>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Customer</th>
                    <th className="py-3 pr-4">Contact</th>
                    <th className="py-3 pr-4">Interest</th>
                    <th className="py-3 pr-4">Message</th>
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {quoteRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="py-4 pr-4">
                        <p className="font-bold text-slate-950">{request.name}</p>
                        <p className="text-xs text-slate-500">{request.company || "No company"}</p>
                      </td>
                      <td className="py-4 pr-4 text-slate-600">
                        <p>{request.phone}</p>
                        <p>{request.email}</p>
                      </td>
                      <td className="py-4 pr-4 text-slate-600">{request.product?.name ?? request.productInterest ?? "General enquiry"}</td>
                      <td className="max-w-xs py-4 pr-4 text-slate-600">{request.message}</td>
                      <td className="py-4 pr-4 text-slate-500">{formatDate(request.createdAt)}</td>
                      <td className="py-4">
                        <form action={updateQuoteRequestStatus} className="flex gap-2">
                          <input type="hidden" name="quoteRequestId" value={request.id} />
                          <select name="status" defaultValue={request.status} className={inputClass}>
                            <option value="NEW">New</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="QUOTED">Quoted</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                          <button className={buttonClass}>Save</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {quoteRequests.length === 0 ? <p className="py-5 text-sm text-slate-500">No quote requests yet.</p> : null}
            </div>
          </div>

          <div className={panelClass}>
            <h3 className="text-xl font-black text-slate-950">Promotions</h3>
            <div className="mt-5 grid gap-4">
              {promotions.map((promotion) => (
                <form key={promotion.id} action={updatePromotion} className="grid gap-3 rounded-md border border-slate-200 p-4">
                  <input type="hidden" name="promotionId" value={promotion.id} />
                  <input name="title" required defaultValue={promotion.title} className={inputClass} />
                  <textarea name="description" defaultValue={promotion.description ?? ""} rows={2} className={inputClass} />
                  <input name="imageUrl" defaultValue={promotion.imageUrl ?? ""} className={inputClass} />
                  <input name="image" type="file" accept="image/*" className={inputClass} />
                  <div className="grid gap-3 md:grid-cols-4">
                    <input name="startsAt" type="date" defaultValue={dateValue(promotion.startsAt)} className={inputClass} />
                    <input name="endsAt" type="date" defaultValue={dateValue(promotion.endsAt)} className={inputClass} />
                    <input name="ctaLabel" defaultValue={promotion.ctaLabel} className={inputClass} />
                    <input name="ctaLink" defaultValue={promotion.ctaLink} className={inputClass} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <input name="sortOrder" type="number" defaultValue={promotion.sortOrder} className={`${inputClass} w-28`} />
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input name="isActive" type="checkbox" defaultChecked={promotion.isActive} className="accent-orange-500" />
                      Enabled
                    </label>
                    <button className={buttonClass}>Update</button>
                  </div>
                </form>
              ))}
              {promotions.length === 0 ? <p className="text-sm text-slate-500">No custom promotions yet. The homepage uses default campaign banners.</p> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
