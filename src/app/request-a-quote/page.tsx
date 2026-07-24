import type { Metadata } from "next";
import Link from "next/link";
import { FileText, MessageCircle } from "lucide-react";
import { submitQuoteRequest } from "@/app/actions";
import { PublicActionForm } from "@/components/forms/public-action-form";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { ButtonLink } from "@/components/ui/button";
import { whatsappUrl } from "@/lib/whatsapp";
import { company } from "@/lib/company";

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Request a CETER Technologies quotation for products, bulk procurement, installation, or support.",
};

export default function RequestQuotePage() {
  return (
    <div className="bg-slate-50">
      <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-wide text-orange-300">Quotation desk</p>
          <h1 className="mt-3 text-4xl font-black">Request product or procurement pricing</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Share models, quantities, location, and any installation or compatibility questions.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <PublicActionForm
          action={submitQuoteRequest}
          pendingLabel="Sending request"
          successMessage="Quote request received. CETER Technologies will follow up."
          className="grid gap-4 rounded-md border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <input name="name" required placeholder="Name" className="h-12 rounded-md border border-slate-200 px-3" />
            <input name="company" placeholder="Company or organization" className="h-12 rounded-md border border-slate-200 px-3" />
            <input name="phone" required placeholder="Phone" className="h-12 rounded-md border border-slate-200 px-3" />
            <input name="email" type="email" required placeholder="Email" className="h-12 rounded-md border border-slate-200 px-3" />
          </div>
          <input name="productInterest" placeholder="Product, model, toner number, or category" className="h-12 rounded-md border border-slate-200 px-3" />
          <textarea name="message" required rows={6} placeholder="Quantity, delivery location, budget range, deadline, installation needs, or compatibility questions" className="rounded-md border border-slate-200 px-3 py-3" />
          <PendingSubmitButton idleLabel="Submit quote request" pendingLabel="Sending request" icon={<FileText className="h-4 w-4" />} className="w-fit" />
        </PublicActionForm>
        <aside className="h-fit rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Useful details to include</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
            <li>Exact product model or SKU where available.</li>
            <li>Quantity and delivery town or county.</li>
            <li>Whether installation, warranty confirmation, or compatibility checking is needed.</li>
            <li>Preferred payment method or procurement process.</li>
          </ul>
          <ButtonLink href={whatsappUrl(`Hello ${company.tradingName}, I need a quotation.`)} variant="outline" className="mt-6 w-full">
            <MessageCircle className="h-4 w-4" />
            Request via WhatsApp
          </ButtonLink>
          <Link href="/products" className="mt-4 block text-sm font-black text-orange-700">Browse catalogue first</Link>
        </aside>
      </section>
    </div>
  );
}
