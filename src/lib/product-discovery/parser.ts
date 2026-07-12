import type { RawDiscoveredProduct } from "./types";

const productWords = [
  "printer",
  "laserjet",
  "deskjet",
  "ecotank",
  "pixma",
  "thinkpad",
  "latitude",
  "inspiron",
  "router",
  "switch",
  "ups",
  "memory",
  "ssd",
  "toner",
  "cartridge",
  "laptop",
  "desktop",
  "access point",
  "keyboard",
  "mouse",
  "webcam",
];

export function absoluteUrl(url: string, baseUrl: string) {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return null;
  }
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function attr(value: string, name: string) {
  const match = value.match(new RegExp(`${name}=["']([^"']+)["']`, "i"));

  return match?.[1] ? decodeEntities(match[1]) : null;
}

function meta(html: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]*>`, "i");
  const tag = html.match(pattern)?.[0];

  return tag ? attr(tag, "content") : null;
}

function parseJsonLd(html: string) {
  const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const values: unknown[] = [];

  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1].trim());
      values.push(parsed);
    } catch {
      // Ignore invalid JSON-LD blocks from public pages.
    }
  }

  return values;
}

function flattenJsonLd(value: unknown): Record<string, unknown>[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(flattenJsonLd);
  }

  if (typeof value === "object") {
    const item = value as Record<string, unknown>;
    const graph = item["@graph"];

    return [item, ...flattenJsonLd(graph)];
  }

  return [];
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function firstImage(value: unknown, baseUrl: string): string[] {
  if (typeof value === "string") {
    const url = absoluteUrl(value, baseUrl);

    return url ? [url] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => firstImage(item, baseUrl));
  }

  if (value && typeof value === "object") {
    return firstImage((value as Record<string, unknown>).url, baseUrl);
  }

  return [];
}

function priceFromValue(value: unknown) {
  const raw = typeof value === "number" ? String(value) : text(value);

  if (!raw) {
    return null;
  }

  const numeric = Number(raw.replace(/[^0-9.]/g, ""));

  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function inferModel(name: string, brand: string) {
  const withoutBrand = name.replace(new RegExp(`\\b${brand}\\b`, "i"), " ");
  const match = withoutBrand.match(/\b[A-Z]?[0-9][A-Z0-9-]{2,}\b/i);

  return match?.[0] ?? null;
}

function looksLikeProduct(name: string) {
  const lower = name.toLowerCase();

  return productWords.some((word) => lower.includes(word)) || /\b[A-Z]?[0-9][A-Z0-9-]{2,}\b/i.test(name);
}

export function extractProductLinks(html: string, pageUrl: string, brand?: string) {
  const links = new Set<string>();

  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = match[1];
    const label = stripHtml(decodeEntities(match[2]));
    const combined = `${href} ${label}`.toLowerCase();
    const brandMatch = brand ? combined.includes(brand.toLowerCase()) : true;

    if (
      brandMatch &&
      (looksLikeProduct(label) || /product|printer|laptop|desktop|router|switch|access-point|access point|ups|ssd|memory|toner|cartridge|keyboard|mouse|webcam/.test(combined))
    ) {
      const url = absoluteUrl(href, pageUrl);

      if (url) {
        links.add(url);
      }
    }
  }

  return [...links];
}

export function parseProductPage(input: {
  html: string;
  sourceName: string;
  sourceKind: RawDiscoveredProduct["sourceKind"];
  sourceUrl: string;
  brand: string;
}): RawDiscoveredProduct | null {
  const { html, sourceName, sourceKind, sourceUrl, brand } = input;
  const jsonLdProducts = flattenJsonLd(parseJsonLd(html)).filter((item) => {
    const type = item["@type"];

    return type === "Product" || (Array.isArray(type) && type.includes("Product"));
  });
  const product = jsonLdProducts[0];
  const title = text(product?.name) ?? meta(html, "og:title") ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const name = title ? decodeEntities(stripHtml(title)).replace(/\s+\|.*$/, "").trim() : "";

  if (!name || !looksLikeProduct(name)) {
    return null;
  }

  const offer = product?.offers && typeof product.offers === "object" && !Array.isArray(product.offers)
    ? product.offers as Record<string, unknown>
    : null;
  const description = text(product?.description) ?? meta(html, "description") ?? meta(html, "og:description");
  const imageUrls = [
    ...firstImage(product?.image, sourceUrl),
    ...firstImage(meta(html, "og:image"), sourceUrl),
  ];
  const sku = text(product?.sku) ?? text(product?.mpn);
  const modelNumber = text(product?.model) ?? sku ?? inferModel(name, brand);
  const price = priceFromValue(offer?.price);
  const currency = text(offer?.priceCurrency);

  return {
    sourceName,
    sourceKind,
    sourceUrl,
    brand,
    name,
    modelNumber,
    sku,
    categoryName: text(product?.category),
    description,
    specifications: {},
    imageUrls: [...new Set(imageUrls)],
    datasheetUrls: extractProductLinks(html, sourceUrl).filter((url) => /\.pdf(\?|$)/i.test(url)),
    price,
    currency,
    rawData: {
      jsonLdProductFound: Boolean(product),
      parsedAt: new Date().toISOString(),
    },
  };
}
