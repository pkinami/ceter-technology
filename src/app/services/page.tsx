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

const serviceDescriptions: Record<string, string> = {
  "Printer installation":
    "USB, Ethernet, and wireless printer setup with drivers, configuration, network connection, print testing, and user guidance.",
  "Printer repair":
    "Diagnosis and repair for printer faults, paper-feed problems, print-quality issues, connectivity failures, and hardware errors.",
  "Maintenance contracts":
    "Preventive maintenance, scheduled servicing, priority support, consumable monitoring, and health checks that reduce downtime.",
  "Office printing solutions":
    "Office print assessments covering device selection, fleet setup, workflows, access controls, and cost-reduction strategies.",
  "IT support":
    "Remote and on-site assistance for computers, software, networks, peripherals, email, security, and everyday technical issues.",
};

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
        <div className="grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map(([service, Icon]) => (
            <article
              key={service}
              className="flex h-full min-h-64 flex-col rounded-lg border border-slate-200 bg-slate-50 p-6"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-white text-orange-500 ring-1 ring-slate-200">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-xl font-black text-slate-950">
                {service}
              </h2>
              <p className="mt-3 grow text-sm leading-6 text-slate-600">
                {serviceDescriptions[service]}
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
