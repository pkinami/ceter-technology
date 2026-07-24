import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { submitQuoteRequest } from "@/app/actions";
import { PublicActionForm } from "@/components/forms/public-action-form";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

export const metadata: Metadata = {
  title: "Request Service",
  description: "Request printer installation, repair, maintenance, networking, or IT support from CETER Technologies.",
};

export default function RequestServicePage() {
  return (
    <div className="bg-slate-50">
      <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-wide text-orange-300">Service request</p>
          <h1 className="mt-3 text-4xl font-black">Printer, copier, and ICT support</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Request installation, repair, maintenance, network setup, or technical support.</p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <PublicActionForm
          action={submitQuoteRequest}
          pendingLabel="Sending request"
          successMessage="Service request received. CETER Technologies will follow up."
          className="grid gap-4 rounded-md border border-slate-200 bg-white p-6 shadow-sm"
        >
          <input type="hidden" name="productInterest" value="Service request" />
          <div className="grid gap-4 sm:grid-cols-2">
            <input name="name" required placeholder="Name" className="h-12 rounded-md border border-slate-200 px-3" />
            <input name="company" placeholder="Company or organization" className="h-12 rounded-md border border-slate-200 px-3" />
            <input name="phone" required placeholder="Phone" className="h-12 rounded-md border border-slate-200 px-3" />
            <input name="email" type="email" required placeholder="Email" className="h-12 rounded-md border border-slate-200 px-3" />
          </div>
          <textarea name="message" required rows={7} placeholder="Device model, fault, location, urgency, and preferred visit time" className="rounded-md border border-slate-200 px-3 py-3" />
          <PendingSubmitButton idleLabel="Submit service request" pendingLabel="Sending request" icon={<Wrench className="h-4 w-4" />} className="w-fit" />
        </PublicActionForm>
      </section>
    </div>
  );
}
