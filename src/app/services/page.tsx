import type { Metadata } from "next";
import {
  MonitorCog,
  Printer,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Printer installation, repair, maintenance contracts, office printing solutions, and IT support.",
};

const services: [string, LucideIcon][] = [
  ["Printer installation", Printer],
  ["Printer repair", Wrench],
  ["Maintenance contracts", ShieldCheck],
  ["Office printing solutions", Printer],
  ["IT support", MonitorCog],
];

export default function ServicesPage() {
  return (
    <div className="bg-white">
      <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-wide text-orange-300">
            Technical services
          </p>
          <h1 className="mt-3 text-4xl font-black">
            Printer and IT support for reliable business operations
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Get help with installation, repair, maintenance, procurement
            planning, and office technology support.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map(([service, Icon]) => (
            <article
              key={service}
              className="rounded-lg border border-slate-200 bg-slate-50 p-6"
            >
              <Icon className="h-9 w-9 text-orange-500" />
              <h2 className="mt-5 text-xl font-black text-slate-950">
                {service}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Professional assessment, practical recommendations, and reliable
                follow-through from CETER Technology.
              </p>
            </article>
          ))}
        </div>
        <div className="mt-10 rounded-lg bg-slate-950 p-8 text-white">
          <h2 className="text-2xl font-black">Need support for your office?</h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            Share your printer model, issue, location, and urgency. Our team can
            prepare the right support response.
          </p>
          <ButtonLink href="/contact" className="mt-6 w-fit">
            Request Service
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
