import Link from "next/link";
import { AtSign, Globe, Link as LinkIcon, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="text-lg font-black tracking-wide">CETER TECHNOLOGY</div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
            Reliable printers, accessories, office equipment, and IT support
            services for homes, businesses, and organizations.
          </p>
          <div className="mt-5 flex gap-3">
            {[Globe, AtSign, LinkIcon].map((Icon, index) => (
              <a
                href="#"
                key={index}
                className="grid h-10 w-10 place-items-center rounded-md bg-white/10 text-white hover:bg-orange-500"
                aria-label="Social media"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-bold">Quick links</h3>
          <ul className="mt-4 grid gap-3 text-sm text-slate-300">
            {["Products", "Services", "About", "Contact", "Cart"].map((item) => (
              <li key={item}>
                <Link href={`/${item.toLowerCase()}`} className="hover:text-white">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold">Product categories</h3>
          <ul className="mt-4 grid gap-3 text-sm text-slate-300">
            <li>Printers</li>
            <li>Ink & Toners</li>
            <li>Printer Accessories</li>
            <li>Office Equipment</li>
            <li>IT Support Services</li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold">Contact details</h3>
          <ul className="mt-4 grid gap-4 text-sm text-slate-300">
            <li className="flex gap-3">
              <Phone className="h-4 w-4 text-orange-500" />
              Phone: +254 700 000 000
            </li>
            <li className="flex gap-3">
              <Mail className="h-4 w-4 text-orange-500" />
              Email: sales@cetertechnology.com
            </li>
            <li className="flex gap-3">
              <MapPin className="h-4 w-4 text-orange-500" />
              Location: Nairobi, Kenya
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-400">
        © 2026 CETER Technology. All rights reserved.
      </div>
    </footer>
  );
}
