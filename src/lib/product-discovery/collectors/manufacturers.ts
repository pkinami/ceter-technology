import { extractProductLinks, parseProductPage } from "../parser";
import type { DiscoverySourceConfig, RawDiscoveredProduct } from "../types";

export const manufacturerSources: DiscoverySourceConfig[] = [
  {
    name: "HP",
    brand: "HP",
    kind: "manufacturer",
    baseUrl: "https://www.hp.com",
    catalogueUrls: ["https://www.hp.com/ke-en/shop/printers.html", "https://www.hp.com/ke-en/shop/laptops-tablets.html"],
  },
  {
    name: "Canon",
    brand: "Canon",
    kind: "manufacturer",
    baseUrl: "https://en.canon-cna.com",
    catalogueUrls: ["https://en.canon-cna.com/printers/"],
  },
  {
    name: "Epson",
    brand: "Epson",
    kind: "manufacturer",
    baseUrl: "https://www.epson.co.ke",
    catalogueUrls: ["https://www.epson.co.ke/en_KE/products/printers/c/printers"],
  },
  {
    name: "Brother",
    brand: "Brother",
    kind: "manufacturer",
    baseUrl: "https://www.brother.com",
    catalogueUrls: ["https://www.brother.com/products/printer/index.aspx"],
  },
  {
    name: "Kyocera",
    brand: "Kyocera",
    kind: "manufacturer",
    baseUrl: "https://www.kyoceradocumentsolutions.com",
    catalogueUrls: ["https://www.kyoceradocumentsolutions.com/en/products/"],
  },
  {
    name: "Xerox",
    brand: "Xerox",
    kind: "manufacturer",
    baseUrl: "https://www.xerox.com",
    catalogueUrls: ["https://www.xerox.com/en-us/office/printers"],
  },
  {
    name: "Ricoh",
    brand: "Ricoh",
    kind: "manufacturer",
    baseUrl: "https://www.ricoh.com",
    catalogueUrls: ["https://www.ricoh.com/products/printers-and-copiers"],
  },
  {
    name: "Dell",
    brand: "Dell",
    kind: "manufacturer",
    baseUrl: "https://www.dell.com",
    catalogueUrls: ["https://www.dell.com/en-us/shop/dell-laptops/sr/laptops"],
  },
  {
    name: "Lenovo",
    brand: "Lenovo",
    kind: "manufacturer",
    baseUrl: "https://www.lenovo.com",
    catalogueUrls: ["https://www.lenovo.com/ke/en/laptops/"],
  },
  {
    name: "Acer",
    brand: "Acer",
    kind: "manufacturer",
    baseUrl: "https://www.acer.com",
    catalogueUrls: ["https://www.acer.com/us-en/laptops", "https://www.acer.com/us-en/desktops"],
  },
  {
    name: "Asus",
    brand: "Asus",
    kind: "manufacturer",
    baseUrl: "https://www.asus.com",
    catalogueUrls: ["https://www.asus.com/laptops/for-home/all-series/", "https://www.asus.com/networking-iot-servers/wifi-routers/all-series/"],
  },
  {
    name: "TP-Link",
    brand: "TP-Link",
    kind: "manufacturer",
    baseUrl: "https://www.tp-link.com",
    catalogueUrls: ["https://www.tp-link.com/ke/home-networking/wifi-router/", "https://www.tp-link.com/ke/business-networking/"],
  },
  {
    name: "APC",
    brand: "APC",
    kind: "manufacturer",
    baseUrl: "https://www.apc.com",
    catalogueUrls: ["https://www.apc.com/ke/en/product-category/88972-uninterruptible-power-supply-ups/"],
  },
  {
    name: "Ubiquiti",
    brand: "Ubiquiti",
    kind: "manufacturer",
    baseUrl: "https://ui.com",
    catalogueUrls: ["https://ui.com/wifi", "https://ui.com/switching"],
  },
  {
    name: "Mikrotik",
    brand: "Mikrotik",
    kind: "manufacturer",
    baseUrl: "https://mikrotik.com",
    catalogueUrls: ["https://mikrotik.com/products"],
  },
  {
    name: "Kingston",
    brand: "Kingston",
    kind: "manufacturer",
    baseUrl: "https://www.kingston.com",
    catalogueUrls: ["https://www.kingston.com/en/ssd", "https://www.kingston.com/en/memory"],
  },
  {
    name: "Logitech",
    brand: "Logitech",
    kind: "manufacturer",
    baseUrl: "https://www.logitech.com",
    catalogueUrls: ["https://www.logitech.com/en-us/products/keyboards.html", "https://www.logitech.com/en-us/products/mice.html"],
  },
];

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "CETER Technology product discovery (+https://cetertechnology.com)",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
    return null;
  }

  return response.text();
}

export async function collectManufacturerProducts(limitPerSource = 8): Promise<{
  products: RawDiscoveredProduct[];
  sourcesChecked: number;
  errors: string[];
}> {
  const products: RawDiscoveredProduct[] = [];
  const errors: string[] = [];
  let sourcesChecked = 0;

  for (const source of manufacturerSources) {
    sourcesChecked += 1;

    try {
      const cataloguePages = await Promise.all(source.catalogueUrls.map((url) => fetchHtml(url)));
      const links = new Set<string>();

      cataloguePages.forEach((html, index) => {
        if (!html) {
          return;
        }

        extractProductLinks(html, source.catalogueUrls[index], source.brand).forEach((url) => links.add(url));
      });

      for (const url of [...links].slice(0, limitPerSource)) {
        const html = await fetchHtml(url);
        const product = html
          ? parseProductPage({
              html,
              sourceName: source.name,
              sourceKind: source.kind,
              sourceUrl: url,
              brand: source.brand ?? source.name,
            })
          : null;

        if (product && product.imageUrls.length > 0) {
          products.push(product);
        }
      }
    } catch (error) {
      errors.push(`${source.name}: ${error instanceof Error ? error.message : "Unknown collection error"}`);
    }
  }

  return { products, sourcesChecked, errors };
}
