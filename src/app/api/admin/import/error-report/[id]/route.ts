import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(_request: NextRequest, context: RouteContext<"/api/admin/import/error-report/[id]">) {
  await requirePermission("PRODUCTS", "BULK");
  const { id } = await context.params;
  const history = await prisma.importHistory.findUnique({ where: { id } });

  if (!history) {
    return new Response("Import history not found.", { status: 404 });
  }

  const errors = Array.isArray(history.errorReport) ? history.errorReport : [];
  const rows = [
    ["Row", "Record", "Errors"],
    ...errors.map((error) => {
      const item = error as { row?: number; identifier?: string; errors?: string[] };
      return [item.row ?? "", item.identifier ?? "", Array.isArray(item.errors) ? item.errors.join("; ") : ""];
    }),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${history.type}-import-errors-${history.id}.csv"`,
    },
  });
}
