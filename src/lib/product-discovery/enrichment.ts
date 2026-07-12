import type { EnrichedProduct, NormalizedDiscoveredProduct } from "./types";

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b[a-z0-9]/g, (char) => char.toUpperCase())
    .replace(/\b(Hp|Ssd|Ups)\b/g, (match) => match.toUpperCase())
    .replace(/\bTp-Link\b/g, "TP-Link");
}

function categoryPath(product: NormalizedDiscoveredProduct) {
  const haystack = `${product.name} ${product.categoryName ?? ""}`.toLowerCase();

  if (/printer|laserjet|deskjet|ecotank|pixma|multifunction|mfp/.test(haystack)) {
    return /multifunction|mfp|all-in-one|ecotank/.test(haystack)
      ? ["Printers", "Multifunction Printers"]
      : ["Printers", "Office Printers"];
  }

  if (/laptop|notebook|thinkpad|latitude|inspiron/.test(haystack)) {
    return ["Computers", "Laptops"];
  }

  if (/desktop|workstation/.test(haystack)) {
    return ["Computers", "Desktops"];
  }

  if (/router|switch|access point|wifi|wi-fi|network/.test(haystack)) {
    return ["Networking", "Routers and Switches"];
  }

  if (/ups|battery|power/.test(haystack)) {
    return ["Power", "UPS and Power Backup"];
  }

  if (/ssd|memory|ram|flash|storage/.test(haystack)) {
    return ["Accessories", "Storage and Memory"];
  }

  if (/toner|cartridge|ink/.test(haystack)) {
    return ["Accessories", "Printer Consumables"];
  }

  return ["Accessories", "Technology Accessories"];
}

export function enrichProduct(product: NormalizedDiscoveredProduct): EnrichedProduct {
  const path = categoryPath(product);
  const model = product.modelNumber ?? product.sku;
  const title = titleCase(
    product.name.toLowerCase().includes(product.brand.toLowerCase())
      ? product.name
      : `${product.brand} ${product.name}`,
  );
  const specifications = {
    ...(model ? { Model: model } : {}),
    Brand: product.brand,
    ...(product.specifications ?? {}),
  };
  const description =
    product.description?.trim() ||
    `${title} discovered from ${product.sourceName}. Product specifications and images are prepared from public catalogue data for admin review.`;

  return {
    ...product,
    title,
    description,
    categoryPath: path,
    categoryName: path.at(-1) ?? "Technology Accessories",
    specifications,
    seoTitle: `${title} in Kenya | CETER Technology`.slice(0, 70),
    seoDescription: `${title}. ${path.join(" > ")} available through CETER Technology Kenya.`.slice(0, 155),
    seoKeywords: [product.brand, model, ...path].filter((item): item is string => Boolean(item)),
  };
}
