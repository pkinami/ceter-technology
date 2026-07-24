import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate } from "../utils";
import { ImportClient } from "./import-client";

export const metadata: Metadata = {
  title: "Catalogue Import",
  description: "Import CETER Technology products and categories from Excel or CSV files.",
};

export default async function AdminImportPage() {
  const recentImports = await prisma.importHistory.findMany({
    include: { admin: true },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-wide text-orange-600">Catalogue Import</p>
        <h1 className="text-2xl font-black text-slate-950">Import products and categories</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Step 1: Import categories. Step 2: Import products with their initial prices and stock quantities.
        </p>
      </div>
      <ImportClient
        recentImports={recentImports.map((item) => ({
          id: item.id,
          type: item.type,
          fileName: item.fileName,
          importedRecords: item.importedRecords,
          failedRecords: item.failedRecords,
          createdAt: formatDate(item.createdAt),
          adminName: item.admin.name,
        }))}
      />
    </section>
  );
}
