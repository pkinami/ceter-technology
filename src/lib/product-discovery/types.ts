import type { Prisma } from "@prisma/client";

export type DiscoverySourceKind = "manufacturer" | "public_catalogue";

export type DiscoverySourceConfig = {
  name: string;
  brand?: string;
  kind: DiscoverySourceKind;
  baseUrl: string;
  catalogueUrls: string[];
};

export type RawDiscoveredProduct = {
  sourceName: string;
  sourceKind: DiscoverySourceKind;
  sourceUrl: string;
  brand: string;
  name: string;
  modelNumber?: string | null;
  sku?: string | null;
  categoryName?: string | null;
  description?: string | null;
  specifications?: Record<string, string>;
  imageUrls: string[];
  datasheetUrls?: string[];
  price?: number | null;
  currency?: string | null;
  rawData?: Prisma.InputJsonValue;
};

export type NormalizedDiscoveredProduct = RawDiscoveredProduct & {
  normalizedBrand: string;
  normalizedModel: string | null;
  normalizedSku: string | null;
  fingerprint: string;
};

export type EnrichedProduct = NormalizedDiscoveredProduct & {
  title: string;
  description: string;
  categoryPath: string[];
  categoryName: string;
  specifications: Record<string, string>;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
};

export type PriceEvidence = {
  source: string;
  url: string;
  price: number;
  currency: "KES";
  collectedAt: string;
};

export type RecommendedPrice = {
  marketPrice: number;
  recommendedPrice: number;
  marginPercent: number;
  evidence: PriceEvidence[];
};

export type DiscoveryRunResult = {
  sourcesChecked: number;
  productsDiscovered: number;
  productsUpdated: number;
  productsCreated: number;
  imagesCollected: number;
  pricesUpdated: number;
  errors: string[];
};

export type DiscoveryProgress = {
  stage: string;
  progress: number;
  totalItems: number;
  completedItems: number;
  errors: number;
};

export type DiscoveryProgressReporter = (progress: DiscoveryProgress) => Promise<void> | void;
