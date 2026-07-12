import type { EnrichedProduct, PriceEvidence, RecommendedPrice } from "./types";

function marginForCategory(categoryPath: string[]) {
  const joined = categoryPath.join(" ").toLowerCase();

  if (/printer/.test(joined)) {
    return 20;
  }

  if (/computer|laptop|desktop/.test(joined)) {
    return 15;
  }

  return 35;
}

function sameProduct(evidence: PriceEvidence, product: EnrichedProduct) {
  const haystack = evidence.url.toUpperCase();
  const model = product.normalizedModel ?? product.normalizedSku;

  return Boolean(model && haystack.replace(/[^A-Z0-9]/g, "").includes(model));
}

export function recommendKenyaPrice(product: EnrichedProduct, evidence: PriceEvidence[]): RecommendedPrice | null {
  const directProductPrice = product.currency === "KES" && product.price && product.price > 0
    ? [{
        source: product.sourceName,
        url: product.sourceUrl,
        price: product.price,
        currency: "KES" as const,
        collectedAt: new Date().toISOString(),
      }]
    : [];
  const matchingEvidence = [...directProductPrice, ...evidence.filter((item) => sameProduct(item, product))];

  if (matchingEvidence.length === 0) {
    return null;
  }

  const average = matchingEvidence.reduce((sum, item) => sum + item.price, 0) / matchingEvidence.length;
  const marginPercent = marginForCategory(product.categoryPath);
  const recommendedPrice = Math.ceil((average * (1 + marginPercent / 100)) / 100) * 100;

  return {
    marketPrice: Math.round(average),
    recommendedPrice,
    marginPercent,
    evidence: matchingEvidence,
  };
}
