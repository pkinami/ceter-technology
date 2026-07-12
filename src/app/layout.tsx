import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { RouteProgress } from "@/components/layout/route-progress";
import { AnalyticsScripts } from "@/components/marketing/analytics-scripts";
import { WhatsAppFloatingButton } from "@/components/marketing/whatsapp-floating-button";
import { ToastProvider } from "@/components/ui/toast";
import { validateProductionEnv } from "@/lib/env";
import "./globals.css";

validateProductionEnv();

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
    url: "https://cetertechnology.com",
    siteName: "CETER Technology",
    images: ["/images/ceter-hero.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CETER Technology | Reliable Printing Solutions",
    description:
      "Shop printers, ink, toners, office equipment, and support services from CETER Technology.",
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
        <ToastProvider>
          <Suspense fallback={null}>
            <RouteProgress />
          </Suspense>
          <AnalyticsScripts />
          <Header />
          <main className="flex-1">{children}</main>
          <WhatsAppFloatingButton />
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
