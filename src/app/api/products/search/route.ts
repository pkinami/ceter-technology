import { NextResponse } from "next/server";
import { searchProducts, type ProductSearchFilters } from "@/lib/product-search";

export const runtime = "nodejs";

function numberParam(value: string | null) {
  if (!value) {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const availability = searchParams.get("availability");
  const filters: ProductSearchFilters = {
    query: searchParams.get("q") ?? undefined,
    brand: searchParams.get("brand") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    minPrice: numberParam(searchParams.get("minPrice")),
    maxPrice: numberParam(searchParams.get("maxPrice")),
    availability: availability === "available" || availability === "out" ? availability : undefined,
    limit: numberParam(searchParams.get("limit")),
  };

  const products = await searchProducts(filters);

  return NextResponse.json({ products });
}
