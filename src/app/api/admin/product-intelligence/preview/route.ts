import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import {
  type CatalogueSourceKind,
  parseCatalogueFile,
  parsePublicManufacturerData,
  previewProductIntelligenceImport,
  sourceKindFromFileName,
} from "@/lib/product-intelligence";

const allowedExtensions = [".xlsx", ".xls", ".csv", ".json"];
const sourceKinds: CatalogueSourceKind[] = [
  "manufacturer_catalogue",
  "public_manufacturer_data",
  "excel",
  "csv",
  "json",
];

function sourceKind(value: FormDataEntryValue | null): CatalogueSourceKind {
  return typeof value === "string" && sourceKinds.includes(value as CatalogueSourceKind)
    ? (value as CatalogueSourceKind)
    : "manufacturer_catalogue";
}

function validateFile(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  const lowerName = file.name.toLowerCase();
  if (!allowedExtensions.some((extension) => lowerName.endsWith(extension))) {
    throw new Error("Only .xlsx, .xls, .csv, and .json catalogue files are allowed.");
  }

  return file;
}

export async function POST(request: NextRequest) {
  await requirePermission("PRODUCTS", "BULK");

  try {
    const formData = await request.formData();
    const kind = sourceKind(formData.get("sourceKind"));
    const file = validateFile(formData.get("file"));
    const publicUrl = typeof formData.get("publicUrl") === "string" ? String(formData.get("publicUrl")).trim() : "";

    if (!file && !publicUrl) {
      return NextResponse.json({ ok: false, message: "Upload a catalogue file or enter a public manufacturer data URL." }, { status: 400 });
    }

    if (publicUrl && !/^https:\/\//i.test(publicUrl)) {
      return NextResponse.json({ ok: false, message: "Public manufacturer data URLs must start with https://." }, { status: 400 });
    }

    const input = file
      ? {
          fileName: file.name,
          sourceKind: sourceKindFromFileName(file.name, kind),
          rows: await parseCatalogueFile(file),
        }
      : {
          ...(await parsePublicManufacturerData(publicUrl)),
          sourceKind: "public_manufacturer_data" as const,
        };

    const preview = await previewProductIntelligenceImport(input);

    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unable to preview catalogue data." },
      { status: 400 },
    );
  }
}
