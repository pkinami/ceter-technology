import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Bot,
  ClipboardCheck,
  DatabaseZap,
  PackageCheck,
  PackageSearch,
  TriangleAlert,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminActionForm, StatusBadge } from "../admin-feedback";
import { syncMarketplace } from "../actions";
import { formatDate } from "../utils";
import { ImageAutomationControl } from "../automation/image-automation-control";

export const metadata: Metadata = {
  title: "Product AI | Admin",
  description: "Product discovery, enrichment, quality checks, and publishing queue.",
};

function numberValue(value: number) {
  return new Intl.NumberFormat("en-KE").format(value);
}

export default async function ProductAiPage() {
  const [
    processingQueue,
    newProductsFound,
    productsEnriched,
    productsPublished,
    needsAttention,
    discoveries,
    qualityChecks,
    recentSources,
  ] = await Promise.all([
    prisma.automationJob.count({ where: { status: { in: ["QUEUED", "RUNNING"] } } }),
    prisma.productDiscovery.count({ where: { status: "NEW" } }),
    prisma.productSource.count({ where: { status: { in: ["ENRICHED", "READY_FOR_REVIEW", "PUBLISHED"] } } }),
    prisma.product.count({ where: { status: { in: ["ACTIVE", "OUT_OF_STOCK"] } } }),
    prisma.productQualityCheck.count({ where: { status: "NEEDS_ATTENTION" } }),
    prisma.productDiscovery.findMany({
      include: { dataSource: true, product: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.productQualityCheck.findMany({
      include: { product: true, productSource: true },
      orderBy: { checkedAt: "desc" },
      take: 8,
    }),
    prisma.productSource.findMany({
      include: { dataSource: true, product: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);
  const metrics = [
    { label: "Processing queue", value: processingQueue, icon: Bot },
    { label: "New products found", value: newProductsFound, icon: PackageSearch },
    { label: "Products enriched", value: productsEnriched, icon: BadgeCheck },
    { label: "Products published", value: productsPublished, icon: PackageCheck },
    { label: "Needs attention", value: needsAttention, icon: TriangleAlert },
  ];
  const lastUpdated =
    recentSources[0]?.updatedAt ?? discoveries[0]?.createdAt ?? qualityChecks[0]?.checkedAt ?? null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-orange-600">Product intelligence engine</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">
            Automated product discovery and publishing control
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Monitor product detection, brand detection, category classification, duplicate matching, specification extraction, image collection, SEO generation, and quality gates.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
              Live activity
            </span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600">
              Last updated {lastUpdated ? formatDate(lastUpdated) : "never"}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <AdminActionForm
            action={syncMarketplace}
            icon="sparkles"
            idleLabel="Sync marketplace"
            pendingLabel="Syncing products..."
            progressTitle="Product intelligence sync running"
            steps={[
              "Connecting to sources",
              "Checking product feeds",
              "Processing products",
              "Updating images",
              "Publishing changes",
            ]}
            successTitle="Marketplace Sync Completed"
          />
          <ImageAutomationControl compact />
          <Link
            href="/admin/automation"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
          >
            <DatabaseZap className="h-4 w-4" />
            Open automation
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div key={metric.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md">
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

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Discovery feed</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Detected product</th>
                    <th className="py-3 pr-4">Brand</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Source</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {discoveries.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 pr-4 font-bold text-slate-950">{item.detectedName}</td>
                      <td className="py-4 pr-4 text-slate-600">{item.detectedBrand ?? "Unknown"}</td>
                      <td className="py-4 pr-4 text-slate-600">{item.detectedCategory ?? "Unclassified"}</td>
                      <td className="py-4 pr-4 text-slate-600">{item.dataSource?.name ?? "Automation"}</td>
                      <td className="py-4 pr-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-4 text-slate-500">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {discoveries.length === 0 ? (
                <p className="py-6 text-sm text-slate-500">No discovery records yet. Run Sync Marketplace from Automation.</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Recently enriched records</h2>
            <div className="mt-5 grid gap-3">
              {recentSources.map((source) => (
                <article key={source.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-black text-slate-950">{source.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {source.brand || "Unknown brand"} - {source.categoryName ?? "Unclassified"} - {source.dataSource.name}
                      </p>
                    </div>
                    <StatusBadge status={source.status} />
                  </div>
                </article>
              ))}
              {recentSources.length === 0 ? (
                <p className="text-sm text-slate-500">No enriched source records yet.</p>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-6 w-6 text-orange-500" />
              <div>
                <h2 className="text-xl font-black text-slate-950">Quality gate</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Incomplete products stay out of the customer catalogue.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {qualityChecks.map((check) => (
                <div key={check.id} className="rounded-md bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-950">
                    {check.product?.name ?? check.productSource?.name ?? "Source record"}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={check.status} />
                  </div>
                  {check.issues.length > 0 ? (
                    <p className="mt-2 text-sm text-slate-600">{check.issues.join(" ")}</p>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">Ready for automated publishing.</p>
                  )}
                </div>
              ))}
              {qualityChecks.length === 0 ? (
                <p className="text-sm text-slate-500">No quality checks have run yet.</p>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
