"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  FileSearch,
  ImageOff,
  Loader2,
  PackageCheck,
  Upload,
} from "lucide-react";
import type {
  CatalogueSourceKind,
  ProductIntelligencePreview,
  ProductIntelligenceProcessResult,
} from "@/lib/product-intelligence";

type DataSourceOption = {
  id: string;
  name: string;
  connectionType: string;
};

type ImportState = {
  preview: ProductIntelligencePreview | null;
  result: ProductIntelligenceProcessResult | null;
  loading: boolean;
  message: string | null;
};

const sourceKinds: { value: CatalogueSourceKind; label: string }[] = [
  { value: "manufacturer_catalogue", label: "Manufacturer catalogue" },
  { value: "public_manufacturer_data", label: "Public manufacturer data" },
  { value: "excel", label: "Excel import" },
  { value: "csv", label: "CSV import" },
  { value: "json", label: "JSON import" },
];

const emptyState: ImportState = {
  preview: null,
  result: null,
  loading: false,
  message: null,
};

export function ImportAutomationClient({ dataSources }: { dataSources: DataSourceOption[] }) {
  const [state, setState] = useState<ImportState>(emptyState);
  const [dataSourceId, setDataSourceId] = useState("");

  async function previewImport(formData: FormData) {
    setState({ ...emptyState, loading: true });

    const response = await fetch("/api/admin/product-intelligence/preview", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();

    setDataSourceId(typeof formData.get("dataSourceId") === "string" ? String(formData.get("dataSourceId")) : "");
    setState({
      preview: payload.ok ? payload.preview : null,
      result: null,
      loading: false,
      message: payload.ok ? null : payload.message,
    });
  }

  async function processProducts() {
    if (!state.preview) return;

    setState((current) => ({ ...current, loading: true, message: null }));

    const response = await fetch("/api/admin/product-intelligence/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataSourceId,
        preview: state.preview,
      }),
    });
    const payload = await response.json();

    setState((current) => ({
      ...current,
      result: payload.ok ? payload.result : null,
      loading: false,
      message: payload.ok ? null : payload.message,
    }));
  }

  const previewRows = useMemo(() => state.preview?.rows ?? [], [state.preview]);
  const duplicateRows = useMemo(() => previewRows.filter((row) => row.duplicate).slice(0, 8), [previewRows]);
  const exceptionRows = useMemo(
    () => previewRows.filter((row) => row.missingImages || row.missingSpecifications || !row.categoryId).slice(0, 8),
    [previewRows],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <FileSearch className="h-6 w-6 text-orange-500" />
          <div>
            <h2 className="text-xl font-black text-slate-950">Automated product ingestion</h2>
            <p className="mt-1 text-sm text-slate-500">
              Stage manufacturer catalogues and public product data without changing the manual Excel templates.
            </p>
          </div>
        </div>

        <form action={previewImport} className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Source type
            <select name="sourceKind" defaultValue="manufacturer_catalogue" className="rounded-md border border-slate-300 px-3 py-2">
              {sourceKinds.map((kind) => (
                <option key={kind.value} value={kind.value}>
                  {kind.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Data source
            <select
              name="dataSourceId"
              value={dataSourceId}
              onChange={(event) => setDataSourceId(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">Use automation import source</option>
              {dataSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name} ({source.connectionType})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Upload catalogue file
            <input
              name="file"
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              className="rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Public manufacturer data URL
            <input name="publicUrl" type="url" placeholder="https://manufacturer.example/catalogue.json" className="rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <button
            disabled={state.loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 lg:col-span-2"
          >
            {state.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {state.loading ? "Processing..." : "Preview detected products"}
          </button>
        </form>

        {state.loading ? (
          <ProgressPanel
            title="Product intelligence scan running"
            steps={["Reading source data", "Detecting products", "Checking duplicates", "Validating images and specs"]}
          />
        ) : null}

        {state.message ? (
          <div className="mt-5 flex gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {state.message}
          </div>
        ) : null}
      </section>

      {state.preview ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">Product intelligence preview</h2>
              <p className="mt-1 text-sm text-slate-500">
                {state.preview.fileName} - {state.preview.detectedProducts} detected product records.
              </p>
            </div>
            <button
              type="button"
              disabled={state.loading || state.preview.readyForCreation === 0}
              onClick={processProducts}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {state.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              {state.loading ? "Processing products..." : "Process products automatically"}
            </button>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <PreviewStat label="Detected" value={state.preview.detectedProducts} />
            <PreviewStat label="Ready" value={state.preview.readyForCreation} />
            <PreviewStat label="Duplicates" value={state.preview.duplicates} />
            <PreviewStat label="Missing images" value={state.preview.missingImages} />
            <PreviewStat label="Missing specs" value={state.preview.missingSpecifications} />
          </dl>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4">Brand</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Images</th>
                  <th className="py-3 pr-4">Specs</th>
                  <th className="py-3 pr-4">Duplicate</th>
                  <th className="py-3">Creation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {previewRows.slice(0, 25).map((row) => (
                  <tr key={`${row.row}-${row.sourceKey}`}>
                    <td className="py-4 pr-4">
                      <p className="font-bold text-slate-950">{row.name || `Row ${row.row}`}</p>
                      <p className="mt-1 text-xs text-slate-500">{row.modelNumber || row.sku || row.seoTitle}</p>
                    </td>
                    <td className="py-4 pr-4 text-slate-600">{row.brand || "Undetected"}</td>
                    <td className="py-4 pr-4 text-slate-600">{row.categoryName || "Unclassified"}</td>
                    <td className="py-4 pr-4 text-slate-600">{row.imageUrls.length}</td>
                    <td className="py-4 pr-4 text-slate-600">{row.specificationCount}</td>
                    <td className="py-4 pr-4">
                      <StatusPill tone={row.duplicate ? "warning" : "ok"} label={row.duplicate ? "Duplicate" : "Clear"} />
                    </td>
                    <td className="py-4">
                      <StatusPill tone={row.readyForProductCreation ? "ok" : "blocked"} label={row.readyForProductCreation ? "Draft product" : "Source only"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewRows.length > 25 ? (
              <p className="mt-4 text-sm text-slate-500">Showing first 25 detected products. Processing uses all rows.</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {state.preview ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ExceptionPanel title="Duplicates" icon="duplicate" rows={duplicateRows.map((row) => ({
            id: `${row.row}-${row.sourceKey}`,
            title: row.name || `Row ${row.row}`,
            detail: row.duplicateReason || "Duplicate detected.",
          }))} />
          <ExceptionPanel title="Missing product intelligence" icon="missing" rows={exceptionRows.map((row) => ({
            id: `${row.row}-${row.sourceKey}`,
            title: row.name || `Row ${row.row}`,
            detail: row.issues.join(" "),
          }))} />
        </div>
      ) : null}

      {state.result ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-sm font-semibold text-emerald-900 shadow-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-black">Automation processing complete</p>
              <p className="mt-1">
                {state.result.productSourcesCreated} source records created, {state.result.productsCreated} draft products created,
                {" "}
                {state.result.matchedProducts} duplicate matches logged, {state.result.failedRows} failed rows.
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ProgressPanel({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="mt-5 rounded-lg border border-orange-200 bg-orange-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-black text-orange-950">
          <Loader2 className="h-4 w-4 animate-spin" />
          {title}
        </div>
        <span className="text-xs font-black text-orange-700">Working</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full w-2/3 animate-pulse rounded-full bg-orange-500" />
      </div>
      <div className="mt-4 grid gap-2">
        {steps.map((step) => (
          <div key={step} className="flex items-center gap-2 text-sm font-semibold text-orange-950">
            <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-black text-slate-950">{value}</dd>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "ok" | "warning" | "blocked" }) {
  const className =
    tone === "ok"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-700";

  return <span className={`rounded-md px-2 py-1 text-xs font-bold ${className}`}>{label}</span>;
}

function ExceptionPanel({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: "duplicate" | "missing";
  rows: { id: string; title: string; detail: string }[];
}) {
  const Icon = icon === "duplicate" ? PackageCheck : ImageOff;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-orange-500" />
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
      </div>
      <div className="mt-5 space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-md bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-950">{row.title}</p>
            <p className="mt-1 text-sm text-slate-500">{row.detail}</p>
          </div>
        ))}
        {rows.length === 0 ? <p className="text-sm text-slate-500">No records in this exception group.</p> : null}
      </div>
    </section>
  );
}
