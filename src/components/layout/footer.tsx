import Link from "next/link";
import { connection } from "next/server";
import { AtSign, Globe, Link as LinkIcon, Mail, MapPin, Phone } from "lucide-react";
import { company } from "@/lib/company";
import { getNavigationCategories } from "@/lib/catalog";

const socialLinks = [
  { href: "/", label: `${company.tradingName} website`, icon: Globe },
  { href: `mailto:${company.email}`, label: `Email ${company.tradingName}`, icon: AtSign },
  { href: "/contact", label: `Contact ${company.tradingName}`, icon: LinkIcon },
];

const quickLinks = [
  ["Products", "/products"],
  ["Services", "/services"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Track Order", "/track-order"],
  ["Request a Quote", "/request-a-quote"],
];

export async function Footer() {
  await connection();

  const categories = await getNavigationCategories().catch(() => []);

  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="text-lg font-black tracking-wide">{company.legalName}</div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
            Printers, photocopiers, consumables, computers, networking, power solutions, and ICT support for Kenyan businesses and institutions.
          </p>
          <div className="mt-5 flex gap-3">
            {socialLinks.map(({ href, label, icon: Icon }) => (
              <a
                href={href}
                key={href}
                className="grid h-10 w-10 place-items-center rounded-md bg-white/10 text-white hover:bg-orange-500"
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-bold">Quick links</h3>
          <ul className="mt-4 grid gap-3 text-sm text-slate-300">
            {quickLinks.map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold">Product categories</h3>
          <ul className="mt-4 grid gap-3 text-sm text-slate-300">
            {categories.slice(0, 6).map((category) => (
              <li key={category.id}>
                <Link href={`/products?category=${encodeURIComponent(category.slug)}`} className="hover:text-white">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold">Contact details</h3>
          <ul className="mt-4 grid gap-4 text-sm text-slate-300">
            <li className="flex gap-3">
              <Phone className="h-4 w-4 text-orange-500" />
              Phone: {company.phoneDisplay}
            </li>
            <li className="flex gap-3">
              <Mail className="h-4 w-4 text-orange-500" />
              Email: {company.email}
            </li>
            <li className="flex gap-3">
              <MapPin className="h-4 w-4 text-orange-500" />
              Location: Nairobi, Kenya
            </li>
          </ul>
          <p className="mt-5 text-sm leading-6 text-slate-300">
            Business hours are confirmed with customer support.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <nav className="mx-auto flex max-w-7xl flex-wrap justify-center gap-4 px-4 py-4 text-xs font-semibold text-slate-400 sm:px-6 lg:px-8" aria-label="Policies">
          <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
          <Link href="/shipping-policy" className="hover:text-white">Shipping Policy</Link>
          <Link href="/returns-policy" className="hover:text-white">Returns Policy</Link>
          <Link href="/terms-and-conditions" className="hover:text-white">Terms and Conditions</Link>
        </nav>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-400">
        &copy; 2026 {company.legalName}. All rights reserved.
      </div>
    </footer>
  );
}
