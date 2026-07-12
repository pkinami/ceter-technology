import type { NormalizedDiscoveredProduct, RawDiscoveredProduct } from "./types";

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

function normalizeToken(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

  return normalized || null;
}

function normalizeBrand(value: string) {
  const match = brands.find((brand) => normalizeToken(brand) === normalizeToken(value));

  return match ?? value.trim();
}

function inferSku(name: string) {
  const match = name.match(/\b[A-Z0-9]{1,4}-?[A-Z]?[0-9][A-Z0-9-]{2,}\b/i);

  return match?.[0] ?? null;
}

export function normalizeProduct(product: RawDiscoveredProduct): NormalizedDiscoveredProduct {
  const brand = normalizeBrand(product.brand || brands.find((item) => product.name.toLowerCase().includes(item.toLowerCase())) || "");
  const model = normalizeToken(product.modelNumber) ?? normalizeToken(inferSku(product.name));
  const sku = normalizeToken(product.sku) ?? model;

  return {
    ...product,
    brand,
    normalizedBrand: normalizeToken(brand) ?? brand.toUpperCase(),
    normalizedModel: model,
    normalizedSku: sku,
    fingerprint: [normalizeToken(brand), sku ?? model ?? normalizeToken(product.name)].filter(Boolean).join(":"),
  };
}

export function dedupeNormalizedProducts(products: NormalizedDiscoveredProduct[]) {
  const seen = new Set<string>();
  const result: NormalizedDiscoveredProduct[] = [];

  for (const product of products) {
    if (!product.fingerprint || seen.has(product.fingerprint)) {
      continue;
    }

    seen.add(product.fingerprint);
    result.push(product);
  }

  return result;
}
