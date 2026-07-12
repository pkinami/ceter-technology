import type { Metadata } from "next";
import {
  BadgePercent,
  BadgeCheck,
  BarChart3,
  Bot,
  CalendarClock,
  DatabaseZap,
  PackageCheck,
  TriangleAlert,
  WandSparkles,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminActionForm, StatusBadge } from "../admin-feedback";
import { createPriceRule, runAutomationJob } from "../actions";
import { formatDate, money } from "../utils";
import { ImageAutomationControl } from "./image-automation-control";
import { MarketplaceSyncControl } from "./marketplace-sync-control";

export const metadata: Metadata = {
  title: "Automation | Admin",
  description: "Product intelligence and catalogue automation dashboard.",
};

export const dynamic = "force-dynamic";

const jobTypes = [
  "MANUFACTURER_SYNC",
  "SUPPLIER_SYNC",
  "CATALOGUE_IMPORT",
  "IMAGE_COLLECTION",
  "SPEC_EXTRACTION",
  "PRODUCT_ENRICHMENT",
  "PRICE_UPDATE",
  "MARKET_PRICE_CHECK",
  "INVENTORY_UPDATE",
  "SEO_GENERATION",
  "MARKETING_ANALYSIS",
  "BUSINESS_REPORT",
];

const schedules = [
  { cadence: "Every day", task: "Product discovery", type: "MANUFACTURER_SYNC" },
  { cadence: "Every 12 hours", task: "Price update", type: "PRICE_UPDATE" },
  { cadence: "Weekly", task: "Catalogue refresh", type: "CATALOGUE_IMPORT" },
  { cadence: "Every hour", task: "Stock update", type: "INVENTORY_UPDATE" },
  { cadence: "Monthly", task: "Product performance analysis", type: "BUSINESS_REPORT" },
];

const scopes = ["GLOBAL", "CATEGORY", "BRAND", "PRODUCT"];

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/^\w/, (item) => item.toUpperCase());
}

function numberValue(value: number) {
  return new Intl.NumberFormat("en-KE").format(value);
}

export default async function AutomationPage() {
  const [
    productSources,
    readySources,
    imageSources,
    verifiedImages,
    products,
    productsWithoutImages,
    marketIndexes,
    priceUpdates,
    failedJobs,
    latestJobs,
    latestAutomationLog,
    priceRules,
    categories,
    dataSources,
    qualityChecks,
    needsAttentionChecks,
    lastMarketplaceSync,
    runningJobs,
    apiErrors,
  ] = await Promise.all([
    prisma.productSource.count(),
    prisma.productSource.count({ where: { status: { in: ["READY_FOR_REVIEW", "PUBLISHED"] }, imageVerified: true } }),
    prisma.imageSource.count(),
    prisma.imageSource.count({ where: { isVerified: true } }),
    prisma.product.count(),
    prisma.product.count({ where: { OR: [{ imageUrl: null }, { imageUrl: "" }] } }),
    prisma.marketPriceIndex.count(),
    prisma.priceHistory.count(),
    prisma.automationJob.count({ where: { status: "FAILED" } }),
    prisma.automationJob.findMany({
      include: { dataSource: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.automationLog.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.priceRule.findMany({ orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }] }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.dataSource.findMany({ orderBy: { name: "asc" } }),
    prisma.productQualityCheck.count(),
    prisma.productQualityCheck.count({ where: { status: "NEEDS_ATTENTION" } }),
    prisma.automationJob.findFirst({
      where: { type: "MANUFACTURER_SYNC" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.automationJob.count({ where: { status: { in: ["QUEUED", "RUNNING"] } } }),
    prisma.automationLog.count({ where: { level: "error" } }),
  ]);
  const lastSyncOpportunities = lastMarketplaceSync?.opportunities &&
    typeof lastMarketplaceSync.opportunities === "object" &&
    !Array.isArray(lastMarketplaceSync.opportunities)
    ? lastMarketplaceSync.opportunities as Record<string, unknown>
    : {};
  const lastSyncDate = lastMarketplaceSync?.completedAt ?? lastMarketplaceSync?.finishedAt ?? null;
  const sourcesChecked = Number(lastSyncOpportunities.sourcesChecked ?? 0);

  const metrics = [
    {
      label: "Products collected",
      value: productSources,
      icon: Bot,
      detail: `${readySources} image-verified and review-ready`,
    },
    {
      label: "Products created",
      value: products,
      icon: PackageCheck,
      detail: `${productsWithoutImages} manual products missing image URLs`,
    },
    {
      label: "Images collected",
      value: imageSources,
      icon: BadgeCheck,
      detail: `${verifiedImages} verified for publication gates`,
    },
    {
      label: "Price updates",
      value: priceUpdates,
      icon: BadgePercent,
      detail: `${marketIndexes} products have Kenya market indexes`,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
              <p className="mt-3 text-sm text-slate-500">{metric.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <WandSparkles className="h-6 w-6 text-orange-500" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-slate-950">Product intelligence pipeline</h2>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
                      Live
                    </span>
                    {lastMarketplaceSync ? <StatusBadge status={lastMarketplaceSync.status} /> : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Collection, matching, enrichment, SEO, image verification, pricing, and inventory automation.
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Last updated {lastMarketplaceSync?.finishedAt ? formatDate(lastMarketplaceSync.finishedAt) : "never"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <ImageAutomationControl compact />
                <MarketplaceSyncControl />
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              <div className="rounded-md bg-slate-50 p-4 transition hover:bg-white hover:shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-500">Last sync</p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {lastMarketplaceSync?.finishedAt ? formatDate(lastMarketplaceSync.finishedAt) : "Never"}
                </p>
              </div>
              <div className="rounded-md bg-slate-50 p-4 transition hover:bg-white hover:shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-500">Sources checked</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{numberValue(sourcesChecked)}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4 transition hover:bg-white hover:shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-500">Products discovered</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{numberValue(productSources)}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4 transition hover:bg-white hover:shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-500">Products updated</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{numberValue(readySources)}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4 transition hover:bg-white hover:shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-500">Images collected</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{numberValue(imageSources)}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4 transition hover:bg-white hover:shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-500">Errors</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{numberValue(failedJobs + needsAttentionChecks)}</p>
              </div>
            </div>

            {latestAutomationLog ? (
              <div className="mt-4 rounded-md border border-orange-100 bg-orange-50 p-4 text-sm font-semibold text-orange-950">
                {latestAutomationLog.message}
              </div>
            ) : null}

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Job</th>
                    <th className="py-3 pr-4">Source</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Read</th>
                    <th className="py-3 pr-4">Images</th>
                    <th className="py-3 pr-4">Prices</th>
                    <th className="py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {latestJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="py-4 pr-4 font-bold text-slate-950">{job.name}</td>
                      <td className="py-4 pr-4 text-slate-600">{job.dataSource?.name ?? "All sources"}</td>
                      <td className="py-4 pr-4">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="py-4 pr-4 text-slate-600">{numberValue(job.recordsRead)}</td>
                      <td className="py-4 pr-4 text-slate-600">{numberValue(job.imagesCollected)}</td>
                      <td className="py-4 pr-4 text-slate-600">{numberValue(job.pricesUpdated)}</td>
                      <td className="py-4 text-slate-500">{formatDate(job.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {latestJobs.length === 0 ? (
                <p className="py-6 text-sm text-slate-500">No automation jobs have run yet.</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-6 w-6 text-orange-500" />
              <div>
                <h2 className="text-xl font-black text-slate-950">Automation schedules</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Operational cadence for catalogue collection, market pricing, and reporting.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {schedules.map((schedule) => (
                <AdminActionForm
                  key={schedule.task}
                  action={runAutomationJob}
                  className="rounded-lg border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-sm"
                  buttonClassName="mt-4 min-h-9 border border-slate-300 bg-white px-3 py-2 font-bold text-slate-900 hover:bg-slate-100"
                  icon="bot"
                  idleLabel="Run now"
                  pendingLabel="Running..."
                  progressTitle={`${schedule.task} running`}
                  steps={["Queueing job", "Reading source records", "Checking exceptions", "Writing automation result"]}
                  successTitle={`${schedule.task} completed`}
                >
                  <input type="hidden" name="type" value={schedule.type} />
                  <p className="text-sm font-black text-slate-950">{schedule.task}</p>
                  <p className="mt-1 text-sm text-slate-500">{schedule.cadence} - {label(schedule.type)}</p>
                </AdminActionForm>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">Manual emergency override</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Direct job execution remains available for recovery, testing, and source-specific reruns.
                </p>
              </div>
              <AdminActionForm
                action={runAutomationJob}
                className="grid gap-2 lg:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_auto]"
                buttonClassName="min-h-10 border border-slate-300 bg-slate-950 px-3 py-2 font-bold hover:bg-slate-800"
                icon="bot"
                idleLabel="Run job"
                pendingLabel="Running job..."
                progressTitle="Manual job running"
                steps={["Queueing selected job", "Reading data source", "Applying automation checks", "Saving job output"]}
                successTitle="Manual job completed"
              >
                <select name="type" defaultValue="MANUFACTURER_SYNC" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
                  {jobTypes.map((type) => (
                    <option key={type} value={type}>{label(type)}</option>
                  ))}
                </select>
                <select name="dataSourceId" defaultValue="" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
                  <option value="">All sources</option>
                  {dataSources.map((source) => (
                    <option key={source.id} value={source.id}>{source.name}</option>
                  ))}
                </select>
              </AdminActionForm>
            </div>
            <div className="mt-5 border-t border-slate-200 pt-5">
              <ImageAutomationControl />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-orange-500" />
              <div>
                <h2 className="text-xl font-black text-slate-950">Pricing intelligence</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Kenya market index and margin rules drive recommended CETER prices.
                </p>
              </div>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Rule</th>
                    <th className="py-3 pr-4">Scope</th>
                    <th className="py-3 pr-4">Margin</th>
                    <th className="py-3 pr-4">Kenya adjustment</th>
                    <th className="py-3 pr-4">Minimum margin</th>
                    <th className="py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {priceRules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="py-4 pr-4 font-bold text-slate-950">{rule.name}</td>
                      <td className="py-4 pr-4 text-slate-600">{label(rule.scope)}</td>
                      <td className="py-4 pr-4 text-slate-600">{rule.targetMarginPercent.toString()}%</td>
                      <td className="py-4 pr-4 text-slate-600">{rule.kenyaAdjustmentPercent.toString()}%</td>
                      <td className="py-4 pr-4 text-slate-600">{money(rule.minimumMarginAmount)}</td>
                      <td className="py-4">
                        <StatusBadge status={rule.isActive ? "ACTIVE" : "INACTIVE"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {priceRules.length === 0 ? (
                <p className="py-6 text-sm text-slate-500">
                  No price rules yet. Add default margins for printers, accessories, and enterprise equipment.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <DatabaseZap className="h-6 w-6 text-orange-500" />
              <div>
                <h2 className="text-xl font-black text-slate-950">System health dashboard</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Operational status for database, automation, sync, and error monitoring.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="flex items-center justify-between rounded-md bg-emerald-50 p-3 text-sm">
                <span className="font-bold text-emerald-950">Database status</span>
                <StatusBadge status="ACTIVE" />
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 p-3 text-sm">
                <span className="font-bold text-slate-950">Automation status</span>
                <StatusBadge status={runningJobs > 0 ? "RUNNING" : "COMPLETED"} />
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 p-3 text-sm">
                <span className="font-bold text-slate-950">Last sync</span>
                <span className="font-semibold text-slate-600">
                  {lastSyncDate ? formatDate(lastSyncDate) : "Never"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 p-3 text-sm">
                <span className="font-bold text-slate-950">Failed jobs</span>
                <span className="font-black text-slate-950">{numberValue(failedJobs)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 p-3 text-sm">
                <span className="font-bold text-slate-950">API errors</span>
                <span className="font-black text-slate-950">{numberValue(apiErrors)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-50 p-3 text-sm">
                <span className="font-bold text-slate-950">Catalogue products</span>
                <span className="font-black text-slate-950">{numberValue(products)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <BadgePercent className="h-6 w-6 text-orange-500" />
              <div>
                <h2 className="text-xl font-black text-slate-950">Create price rule</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Recommended price = base cost + operating costs + margin + Kenya adjustment.
                </p>
              </div>
            </div>
            <AdminActionForm
              action={createPriceRule}
              className="mt-6 grid gap-4"
              icon="save"
              idleLabel="Save rule"
              pendingLabel="Saving rule..."
              progressTitle="Saving price rule"
              steps={["Validating rule", "Saving margin controls", "Refreshing pricing dashboard"]}
              successTitle="Price rule saved"
            >
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Rule name
                <input name="name" required placeholder="Printers 20% margin" className="rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Scope
                <select name="scope" defaultValue="GLOBAL" className="rounded-md border border-slate-300 px-3 py-2">
                  {scopes.map((scope) => (
                    <option key={scope} value={scope}>{label(scope)}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Category for category scope
                <select name="categoryId" defaultValue="" className="rounded-md border border-slate-300 px-3 py-2">
                  <option value="">None</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Brand for brand scope
                <input name="brand" placeholder="HP" className="rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Margin %
                  <input name="targetMarginPercent" required type="number" min="0" max="999.99" step="0.01" defaultValue={20} className="rounded-md border border-slate-300 px-3 py-2" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Operating %
                  <input name="operatingCostPercent" type="number" min="0" max="999.99" step="0.01" defaultValue={0} className="rounded-md border border-slate-300 px-3 py-2" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Kenya adjustment %
                  <input name="kenyaAdjustmentPercent" type="number" min="-999.99" max="999.99" step="0.01" defaultValue={0} className="rounded-md border border-slate-300 px-3 py-2" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Minimum margin
                  <input name="minimumMarginAmount" type="number" min="0" max="9999999999.99" step="0.01" defaultValue={0} className="rounded-md border border-slate-300 px-3 py-2" />
                </label>
              </div>
              <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                <input name="isActive" type="checkbox" defaultChecked className="accent-orange-500" />
                Active rule
              </label>
            </AdminActionForm>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <TriangleAlert className="h-6 w-6 text-orange-500" />
              <div>
                <h2 className="text-xl font-black text-slate-950">Automation exceptions</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Items that need admin supervision before publication or pricing.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">{productsWithoutImages}</p>
                <p className="mt-1 text-sm text-slate-500">Manual catalogue products missing images</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">{needsAttentionChecks}</p>
                <p className="mt-1 text-sm text-slate-500">Quality checks needing attention from {qualityChecks} checks</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">{failedJobs}</p>
                <p className="mt-1 text-sm text-slate-500">Failed automation jobs</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
