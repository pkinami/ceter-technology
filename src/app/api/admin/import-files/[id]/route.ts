import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnerSuperAdmin } from "@/lib/rbac";
import { createClient } from "@/utils/supabase/server";

type ImportFileRow = {
  id: string;
  originalFileBucket: string | null;
  originalFilePath: string | null;
  errorReportBucket: string | null;
  errorReportPath: string | null;
};

async function columns() {
  const rows = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'ImportHistory'
  `;

  return new Set(rows.map((row) => row.column_name));
}

function assertTarget(bucket: string | null, path: string | null) {
  if (!bucket || !path) {
    return null;
  }

  if (!["product-imports", "import-reports"].includes(bucket) || path.includes("..") || path.startsWith("/") || path.endsWith("/")) {
    throw new Error("Invalid import file storage target.");
  }

  return { bucket, path };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  await requireOwnerSuperAdmin();
  const { id } = await context.params;
  const kind = request.nextUrl.searchParams.get("kind") === "error-report" ? "error-report" : "original";
  const availableColumns = await columns();

  if (
    !availableColumns.has("originalFileBucket") ||
    !availableColumns.has("originalFilePath") ||
    !availableColumns.has("errorReportBucket") ||
    !availableColumns.has("errorReportPath")
  ) {
    return new Response("File not retained.", { status: 404 });
  }

  const rows = await prisma.$queryRaw<ImportFileRow[]>`
    SELECT id, "originalFileBucket", "originalFilePath", "errorReportBucket", "errorReportPath"
    FROM "ImportHistory"
    WHERE id = ${id}
    LIMIT 1
  `;
  const row = rows[0];

  if (!row) {
    return new Response("Import history not found.", { status: 404 });
  }

  const target = kind === "original"
    ? assertTarget(row.originalFileBucket, row.originalFilePath)
    : assertTarget(row.errorReportBucket, row.errorReportPath);

  if (!target) {
    return new Response("File not retained.", { status: 404 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(target.bucket).createSignedUrl(target.path, 60);

  if (error || !data?.signedUrl) {
    return new Response(error?.message ?? "Unable to create file download.", { status: 502 });
  }

  return NextResponse.redirect(data.signedUrl);
}
