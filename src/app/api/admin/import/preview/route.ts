import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/rbac";
import {
  type CategoryImportRow,
  type ImportKind,
  type ProductImportRow,
  normalizeImportRows,
  previewCategoryImport,
  previewProductImport,
} from "@/lib/imports";

const allowedExtensions = [".xlsx", ".csv"];

function isImportKind(value: FormDataEntryValue | null): value is ImportKind {
  return value === "products" || value === "categories";
}

function validateFile(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose an Excel or CSV file to import.");
  }

  const lowerName = file.name.toLowerCase();
  if (!allowedExtensions.some((extension) => lowerName.endsWith(extension))) {
    throw new Error("Only .xlsx and .csv files are allowed.");
  }

  return file;
}

export async function POST(request: NextRequest) {
  await requirePermission("PRODUCTS", "BULK");

  try {
    const formData = await request.formData();
    const kind = formData.get("kind");

    if (!isImportKind(kind)) {
      return NextResponse.json({ ok: false, message: "Invalid import type." }, { status: 400 });
    }

    const file = validateFile(formData.get("file"));
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
    }) as Record<string, unknown>[];
    const rows = normalizeImportRows(kind, rawRows);
    const preview =
      kind === "products"
        ? await previewProductImport(file.name, rows as ProductImportRow[])
        : await previewCategoryImport(file.name, rows as CategoryImportRow[]);

    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unable to preview import." },
      { status: 400 },
    );
  }
}
