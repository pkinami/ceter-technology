import { extractProductLinks, parseProductPage } from "../parser";
import type { DiscoverySourceConfig, PriceEvidence, RawDiscoveredProduct } from "../types";

export const publicCatalogueSources: DiscoverySourceConfig[] = [
  {
    name: "Jumia Kenya",
    kind: "public_catalogue",
    baseUrl: "https://www.jumia.co.ke",
    catalogueUrls: [
      "https://www.jumia.co.ke/catalog/?q=HP+printer",
      "https://www.jumia.co.ke/catalog/?q=Epson+printer",
      "https://www.jumia.co.ke/catalog/?q=TP-Link+router",
      "https://www.jumia.co.ke/catalog/?q=APC+UPS",
      "https://www.jumia.co.ke/catalog/?q=Kingston+SSD",
      "https://www.jumia.co.ke/catalog/?q=Canon+printer",
      "https://www.jumia.co.ke/catalog/?q=Brother+printer",
      "https://www.jumia.co.ke/catalog/?q=Kyocera+printer",
      "https://www.jumia.co.ke/catalog/?q=Xerox+printer",
      "https://www.jumia.co.ke/catalog/?q=Ricoh+printer",
      "https://www.jumia.co.ke/catalog/?q=Dell+laptop",
      "https://www.jumia.co.ke/catalog/?q=Lenovo+laptop",
      "https://www.jumia.co.ke/catalog/?q=Acer+laptop",
      "https://www.jumia.co.ke/catalog/?q=Asus+laptop",
      "https://www.jumia.co.ke/catalog/?q=Ubiquiti",
      "https://www.jumia.co.ke/catalog/?q=Mikrotik+router",
      "https://www.jumia.co.ke/catalog/?q=Logitech",
    ],
  },
];

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "CETER Technology price intelligence (+https://cetertechnology.com)",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
    return null;
  }

  return response.text();
}

function parseKenyaPrice(html: string) {
  const priceMatch = html.match(/(?:KSh|KES|Ksh)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);

  if (!priceMatch) {
    return null;
  }

  const price = Number(priceMatch[1].replace(/,/g, ""));

  return Number.isFinite(price) && price > 0 ? price : null;
}

function inferBrand(name: string) {
  const brands = [
    "HP",
    "Canon",
    "Epson",
    "Brother",
    "Kyocera",
    "Xerox",
    "Ricoh",
    "Dell",
    "Lenovo",
    "Acer",
    "Asus",
    "TP-Link",
    "Ubiquiti",
    "Mikrotik",
    "APC",
    "Kingston",
    "Logitech",
  ];

  return brands.find((brand) => name.toLowerCase().includes(brand.toLowerCase())) ?? "";
}

export async function collectPublicCatalogueProducts(limitPerSource = 8): Promise<{
  products: RawDiscoveredProduct[];
  prices: PriceEvidence[];
  sourcesChecked: number;
  errors: string[];
}> {
  const products: RawDiscoveredProduct[] = [];
  const prices: PriceEvidence[] = [];
  const errors: string[] = [];
  let sourcesChecked = 0;

  for (const source of publicCatalogueSources) {
    sourcesChecked += 1;

    try {
      const cataloguePages = await Promise.all(source.catalogueUrls.map((url) => fetchHtml(url)));
      const links = new Set<string>();

      cataloguePages.forEach((html, index) => {
        if (html) {
          extractProductLinks(html, source.catalogueUrls[index]).forEach((url) => links.add(url));
        }
      });

      for (const url of [...links].slice(0, limitPerSource)) {
        const html = await fetchHtml(url);

        if (!html) {
          continue;
        }

        const price = parseKenyaPrice(html);
        const parsed = parseProductPage({
          html,
          sourceName: source.name,
          sourceKind: source.kind,
          sourceUrl: url,
          brand: inferBrand(html),
        });

        if (parsed) {
          products.push({
            ...parsed,
            price: parsed.price ?? price,
            currency: parsed.currency ?? (price ? "KES" : null),
          });
        }

        if (price) {
          prices.push({
            source: source.name,
            url,
            price,
            currency: "KES",
            collectedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      errors.push(`${source.name}: ${error instanceof Error ? error.message : "Unknown catalogue error"}`);
    }
  }

  return { products, prices, sourcesChecked, errors };
}
