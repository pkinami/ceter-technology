import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cetertechnology.com"),
  title: {
    default: "CETER Technology | Reliable Printing Solutions",
    template: "%s | CETER Technology",
  },
  description:
    "Shop printers, ink, toners, office equipment, and printer or IT support services from CETER Technology.",
  keywords: [
    "CETER Technology",
    "printers Kenya",
    "printer accessories",
    "toners",
    "office equipment",
    "printer support",
  ],
  openGraph: {
    title: "CETER Technology",
    description: "Reliable Printing Solutions for Your Business",
    images: ["/images/ceter-hero.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white text-slate-900">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
