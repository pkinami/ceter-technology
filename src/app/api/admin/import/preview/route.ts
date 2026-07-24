import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import {
  previewCategoryImport,
  previewPriceUpdateImport,
  previewProductImport,
  previewStockUpdateImport,
  normalizeImportRows,
} from "@/lib/imports";
import { previewImportRequest, readWorkbookRows } from "@/lib/import-preview-route";

export async function POST(request: NextRequest) {
  return previewImportRequest(request, {
    requirePermission,
    readWorkbookRows,
    normalizeImportRows,
    json: NextResponse.json,
    preview: {
      products: previewProductImport,
      categories: previewCategoryImport,
      "price-updates": previewPriceUpdateImport,
      "stock-updates": previewStockUpdateImport,
    },
  });
}
