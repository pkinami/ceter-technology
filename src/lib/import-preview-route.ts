import type { Prisma } from "@prisma/client";
import type {
  CategoryImportRow,
  ImportKind,
  ImportPreview,
  PriceUpdateImportRow,
  ProductImportRow,
  StockUpdateImportRow,
} from "./imports.ts";

const allowedExtensions = [".xlsx", ".csv"];

export type ImportPreviewResponse = {
  success: boolean;
  error: string | null;
  details: Record<string, unknown> | null;
  preview: ImportPreview | null;
};

export type PreviewDependencies = {
  requirePermission: (module: "PRODUCTS", action: "BULK") => Promise<unknown>;
  readWorkbookRows: (file: File) => Promise<Record<string, unknown>[]>;
  normalizeImportRows: (kind: ImportKind, rawRows: Record<string, unknown>[]) => unknown[];
  json?: (payload: ImportPreviewResponse, init: { status: number }) => Response;
  preview: {
    products: (fileName: string, rows: ProductImportRow[]) => Promise<ImportPreview>;
    categories: (fileName: string, rows: CategoryImportRow[]) => Promise<ImportPreview>;
    "price-updates": (fileName: string, rows: PriceUpdateImportRow[]) => Promise<ImportPreview>;
    "stock-updates": (fileName: string, rows: StockUpdateImportRow[]) => Promise<ImportPreview>;
  };
};

function isImportKind(value: FormDataEntryValue | null): value is ImportKind {
  return value === "products" || value === "categories" || value === "price-updates" || value === "stock-updates";
}

function jsonResponse(dependencies: PreviewDependencies, payload: ImportPreviewResponse, status = 200) {
  return (dependencies.json ?? Response.json)(payload, { status });
}

function successResponse(dependencies: PreviewDependencies, preview: ImportPreview) {
  return jsonResponse(dependencies, { success: true, error: null, details: null, preview });
}

function failureResponse(dependencies: PreviewDependencies, error: string, status: number, details: Record<string, unknown> | null = null) {
  return jsonResponse(dependencies, { success: false, error, details, preview: null }, status);
}

function sanitizeMessage(message: string) {
  return message
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted database url]")
    .replace(/(password|passwd|pwd|token|secret|api[_-]?key)=([^&\s]+)/gi, "$1=[redacted]")
    .replace(/(DATABASE_URL|POSTGRES_URL|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ANON_KEY)\s*[:=]\s*\S+/gi, "$1=[redacted]");
}

function errorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return { exception: "NonError", message: "Unknown server exception." };
  }

  const maybePrisma = error as Prisma.PrismaClientKnownRequestError;
  return {
    exception: error.name || "Error",
    message: sanitizeMessage(error.message),
    ...(typeof maybePrisma.code === "string" ? { code: maybePrisma.code } : {}),
  };
}

function authFailure(error: unknown, dependencies: PreviewDependencies) {
  const digest = typeof (error as { digest?: unknown })?.digest === "string" ? (error as { digest: string }).digest : "";
  if (!digest.startsWith("NEXT_REDIRECT")) return null;

  return digest.includes("not-authorized")
    ? failureResponse(dependencies, "You do not have permission to preview imports.", 403, { reason: "not-authorized" })
    : failureResponse(dependencies, "Sign in to preview imports.", 401, { reason: "authentication-required" });
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

export async function readWorkbookRows(file: File) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("The workbook does not contain any sheets.");
  }
  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) {
    throw new Error(`Unable to read workbook sheet "${firstSheetName}".`);
  }
  return XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: true,
  }) as Record<string, unknown>[];
}

export async function previewImportRequest(request: Request, dependencies: PreviewDependencies) {
  try {
    try {
      await dependencies.requirePermission("PRODUCTS", "BULK");
    } catch (error) {
      const response = authFailure(error, dependencies);
      if (response) return response;
      throw error;
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength === "0") {
      return failureResponse(dependencies, "Upload a file before previewing an import.", 400, { reason: "empty-request-body" });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      return failureResponse(dependencies, "Invalid import form data.", 400, errorDetails(error));
    }

    const kind = formData.get("kind");

    if (!isImportKind(kind)) {
      return failureResponse(dependencies, "Invalid import type.", 400, { reason: "invalid-import-type" });
    }

    let file: File;
    try {
      file = validateFile(formData.get("file"));
    } catch (error) {
      return failureResponse(dependencies, error instanceof Error ? error.message : "Choose an Excel or CSV file to import.", 400, errorDetails(error));
    }

    let rawRows: Record<string, unknown>[];
    try {
      rawRows = await dependencies.readWorkbookRows(file);
    } catch (error) {
      return failureResponse(dependencies, "Unable to parse workbook.", 400, errorDetails(error));
    }

    const rows = dependencies.normalizeImportRows(kind, rawRows);
    const preview =
      kind === "products"
        ? await dependencies.preview.products(file.name, rows as ProductImportRow[])
        : kind === "categories"
          ? await dependencies.preview.categories(file.name, rows as CategoryImportRow[])
          : kind === "price-updates"
            ? await dependencies.preview["price-updates"](file.name, rows as PriceUpdateImportRow[])
            : await dependencies.preview["stock-updates"](file.name, rows as StockUpdateImportRow[]);

    return successResponse(dependencies, preview);
  } catch (error) {
    return failureResponse(dependencies, "Unable to preview import.", 500, errorDetails(error));
  }
}
