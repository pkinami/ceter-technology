import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { ButtonLink } from "@/components/ui/button";
import { company } from "@/lib/company";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact CETER Technology for product orders, printer support, and IT service requests.",
};

export default function ContactPage() {
  return (
    <div className="bg-slate-50">
      <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-wide text-orange-300">
            Contact us
          </p>
          <h1 className="mt-3 text-4xl font-black">
            Orders, quotes, and support requests
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            Tell us what you need and our team will respond with product or
            service guidance.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-black">Send a message</h2>
          <ContactForm />
        </div>
        <aside className="grid gap-5">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">Contact information</h2>
            <ul className="mt-5 grid gap-4 text-sm text-slate-600">
              <li className="flex gap-3">
                <Phone className="h-5 w-5 text-orange-500" />
                Phone: {company.phoneDisplay}
              </li>
              <li className="flex gap-3">
                <Mail className="h-5 w-5 text-orange-500" />
                Email: {company.email}
              </li>
              <li className="flex gap-3">
                <MapPin className="h-5 w-5 text-orange-500" />
                Location: Nairobi, Kenya
              </li>
            </ul>
            <ButtonLink
              href={whatsappUrl(`Hello ${company.tradingName}, I need assistance.`)}
              variant="secondary"
              className="mt-6 w-full"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Contact
            </ButtonLink>
          </div>
          <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
            Google Maps placeholder
          </div>
        </aside>
      </section>
    </div>
  );
}
