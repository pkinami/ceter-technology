import type { Metadata } from "next";
import { Bot, CalendarClock, Database, GitBranch, PackageSearch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "../../utils";
import { ImportAutomationClient } from "./import-automation-client";

export const metadata: Metadata = {
  title: "Product Import Automation | Admin",
  description: "Automated product intelligence ingestion and processing for CETER Technology.",
};

const workflow = [
  "Raw Product Data",
  "Duplicate Detection",
  "Brand Detection",
  "Category Classification",
  "Specification Extraction",
  "Image Verification",
  "SEO Generation",
  "Database Product Creation",
];

const schedules = [
  { cadence: "Daily", task: "Check new products", type: "MANUFACTURER_SYNC" },
  { cadence: "Weekly", task: "Refresh manufacturer data", type: "PRODUCT_ENRICHMENT" },
  { cadence: "Monthly", task: "Clean duplicates", type: "CATALOGUE_IMPORT" },
];

function numberValue(value: number) {
  return new Intl.NumberFormat("en-KE").format(value);
}

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/^\w/, (item) => item.toUpperCase());
}

export default async function ProductImportAutomationPage() {
  const [
    dataSources,
    catalogueImports,
    detectedSources,
    duplicateMatches,
    missingImages,
    productSourceSpecs,
    latestJobs,
  ] = await Promise.all([
    prisma.dataSource.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, connectionType: true },
    }),
    prisma.catalogueImport.findMany({
      include: { dataSource: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.productSource.count(),
    prisma.productMatch.count(),
    prisma.productSource.count({ where: { imageVerified: false } }),
    prisma.productSource.findMany({ select: { specifications: true } }),
    prisma.automationJob.findMany({
      where: { type: { in: ["MANUFACTURER_SYNC", "PRODUCT_ENRICHMENT", "CATALOGUE_IMPORT"] } },
      include: { dataSource: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);
  const metrics = [
    { label: "Detected source products", value: detectedSources, icon: PackageSearch },
    { label: "Duplicate matches", value: duplicateMatches, icon: GitBranch },
    { label: "Missing images", value: missingImages, icon: Database },
    {
      label: "Missing specifications",
      value: productSourceSpecs.filter((source) => {
        return !source.specifications || Object.keys(source.specifications as Record<string, unknown>).length === 0;
      }).length,
      icon: Bot,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-950">Product intelligence processing engine</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Ingest manufacturer catalogues and public product data, enrich records, detect duplicates, and create draft catalogue products at scale.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div key={metric.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{numberValue(metric.value)}</p>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-md bg-orange-50 text-orange-600">
                  <Icon className="h-6 w-6" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <ImportAutomationClient
            dataSources={dataSources.map((source) => ({
              id: source.id,
              name: source.name,
              connectionType: source.connectionType,
            }))}
          />

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Recent catalogue imports</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">File</th>
                    <th className="py-3 pr-4">Source</th>
                    <th className="py-3 pr-4">Detected</th>
                    <th className="py-3 pr-4">Created</th>
                    <th className="py-3 pr-4">Matched</th>
                    <th className="py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {catalogueImports.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 pr-4 text-slate-500">{formatDate(item.createdAt)}</td>
                      <td className="py-4 pr-4 font-bold text-slate-950">{item.fileName}</td>
                      <td className="py-4 pr-4 text-slate-600">{item.dataSource?.name ?? "Automation source"}</td>
                      <td className="py-4 pr-4 text-slate-600">{numberValue(item.detectedProducts)}</td>
                      <td className="py-4 pr-4 text-slate-600">{numberValue(item.createdProducts)}</td>
                      <td className="py-4 pr-4 text-slate-600">{numberValue(item.matchedProducts)}</td>
                      <td className="py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                          {label(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {catalogueImports.length === 0 ? (
                <p className="py-6 text-sm text-slate-500">No automated catalogue imports have been processed yet.</p>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <GitBranch className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-black text-slate-950">Processing workflow</h2>
            </div>
            <ol className="mt-5 space-y-3">
              {workflow.map((stage, index) => (
                <li key={stage} className="flex items-center gap-3 rounded-md bg-slate-50 p-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-950 text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-800">{stage}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-black text-slate-950">Background jobs</h2>
            </div>
            <div className="mt-5 space-y-3">
              {schedules.map((schedule) => (
                <div key={schedule.task} className="rounded-md bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-950">{schedule.task}</p>
                  <p className="mt-1 text-sm text-slate-500">{schedule.cadence} - {label(schedule.type)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Latest automation jobs</h2>
            <div className="mt-5 space-y-4">
              {latestJobs.map((job) => (
                <div key={job.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <p className="text-sm font-bold text-slate-900">{job.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {label(job.status)} - {job.dataSource?.name ?? "All sources"} - {formatDate(job.createdAt)}
                  </p>
                </div>
              ))}
              {latestJobs.length === 0 ? <p className="text-sm text-slate-500">No product intelligence jobs yet.</p> : null}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
