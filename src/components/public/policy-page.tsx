import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export function PolicyPage({ title, summary }: { title: string; summary: string }) {
  return (
    <div className="bg-slate-50">
      <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-black uppercase tracking-wide text-orange-300">Customer policy</p>
          <h1 className="mt-3 text-4xl font-black">{title}</h1>
          <p className="mt-4 max-w-3xl text-slate-300">{summary}</p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-md border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-600 shadow-sm">
          <p>
            This page provides general customer-facing guidance for the CETER Technologies website. Final terms for a specific order, service request, quotation, delivery, payment, warranty, return, or installation are confirmed in writing by CETER Technologies before or during fulfilment.
          </p>
          <p>
            Product details, prices, stock state, promotions, and images are displayed from the live catalogue database and may change as records are updated by authorised staff or automated catalogue processes.
          </p>
          <p>
            Customers should keep order numbers, tracking numbers, payment references, product packaging, and confirmation messages for support and follow-up.
          </p>
          <Link href="/contact" className="font-black text-orange-700">Contact CETER Technologies for policy questions</Link>
        </div>
      </section>
    </div>
  );
}
