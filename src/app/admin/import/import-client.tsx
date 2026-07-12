"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Download, FileSpreadsheet, Upload } from "lucide-react";
import type { ImportKind, ImportPreview, ImportResult } from "@/lib/imports";

type RecentImport = {
  id: string;
  type: string;
  fileName: string;
  importedRecords: number;
  failedRecords: number;
  createdAt: string;
  adminName: string;
};

type ImportState = {
  preview: ImportPreview | null;
  result: ImportResult | null;
  loading: boolean;
  message: string | null;
};

const emptyState: ImportState = {
  preview: null,
  result: null,
  loading: false,
  message: null,
};

export function ImportClient({ recentImports }: { recentImports: RecentImport[] }) {
  const [states, setStates] = useState<Record<ImportKind, ImportState>>({
    products: emptyState,
    categories: emptyState,
  });

  async function previewImport(kind: ImportKind, formData: FormData) {
    setStates((current) => ({
      ...current,
      [kind]: { ...emptyState, loading: true },
    }));
    formData.set("kind", kind);

    const response = await fetch("/api/admin/import/preview", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();

    setStates((current) => ({
      ...current,
      [kind]: {
        preview: payload.ok ? payload.preview : null,
        result: null,
        loading: false,
        message: payload.ok ? null : payload.message,
      },
    }));
  }

  async function confirmImport(kind: ImportKind) {
    const preview = states[kind].preview;
    if (!preview) return;

    setStates((current) => ({
      ...current,
      [kind]: { ...current[kind], loading: true, message: null },
    }));

    const response = await fetch("/api/admin/import/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        fileName: preview.fileName,
        rows: preview.rows,
      }),
    });
    const payload = await response.json();

    setStates((current) => ({
      ...current,
      [kind]: {
        ...current[kind],
        result: payload.ok ? payload.result : null,
        loading: false,
        message: payload.ok ? null : payload.message,
      },
    }));

  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <ImportPanel
          kind="products"
          title="Import Products"
          templateHref="/api/admin/import/template/products"
          templateLabel="Download Product Import Template"
          state={states.products}
          onPreview={previewImport}
          onConfirm={confirmImport}
          onCancel={() => setStates((current) => ({ ...current, products: emptyState }))}
        />
        <ImportPanel
          kind="categories"
          title="Import Categories"
          templateHref="/api/admin/import/template/categories"
          templateLabel="Download Category Import Template"
          state={states.categories}
          onPreview={previewImport}
          onConfirm={confirmImport}
          onCancel={() => setStates((current) => ({ ...current, categories: emptyState }))}
        />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Recent imports history</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">File name</th>
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4">Imported records</th>
                <th className="py-3 pr-4">Admin user</th>
                <th className="py-3">Errors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentImports.map((item) => (
                <tr key={item.id}>
                  <td className="py-4 pr-4 text-slate-600">{item.createdAt}</td>
                  <td className="py-4 pr-4 font-bold text-slate-950">{item.fileName}</td>
                  <td className="py-4 pr-4 text-slate-600 capitalize">{item.type}</td>
                  <td className="py-4 pr-4 text-slate-600">{item.importedRecords}</td>
                  <td className="py-4 pr-4 text-slate-600">{item.adminName}</td>
                  <td className="py-4">
                    {item.failedRecords > 0 ? (
                      <a
                        href={`/api/admin/import/error-report/${item.id}`}
                        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                      >
                        <Download className="h-4 w-4" />
                        {item.failedRecords} failed
                      </a>
                    ) : (
                      <span className="text-slate-500">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentImports.length === 0 ? (
            <p className="py-6 text-sm text-slate-500">No imports have been run yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ImportPanel({
  kind,
  title,
  templateHref,
  templateLabel,
  state,
  onPreview,
  onConfirm,
  onCancel,
}: {
  kind: ImportKind;
  title: string;
  templateHref: string;
  templateLabel: string;
  state: ImportState;
  onPreview: (kind: ImportKind, formData: FormData) => Promise<void>;
  onConfirm: (kind: ImportKind) => Promise<void>;
  onCancel: () => void;
}) {
  const readyLabel = useMemo(() => {
    const count = state.preview?.validRows ?? 0;
    const noun = kind === "products" ? "products" : "categories";
    return `${count} ${noun} ready to import`;
  }, [kind, state.preview?.validRows]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-6 w-6 text-orange-500" />
          <div>
            <h2 className="text-xl font-black text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">Upload .xlsx or .csv files.</p>
          </div>
        </div>
        <a
          href={templateHref}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">{templateLabel}</span>
          <span className="sm:hidden">Template</span>
        </a>
      </div>

      <form action={(formData) => onPreview(kind, formData)} className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Upload Excel file
          <input
            name="file"
            type="file"
            required
            accept=".xlsx,.csv"
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <button
          disabled={state.loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Upload className="h-4 w-4" />
          {state.loading ? "Checking file..." : "Preview import"}
        </button>
      </form>

      {state.message ? (
        <div className="mt-5 flex gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {state.message}
        </div>
      ) : null}

      {state.preview ? (
        <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-black text-slate-950">Import Preview</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-4">
            <PreviewStat label="Rows detected" value={state.preview.totalRows} />
            <PreviewStat label="Valid" value={state.preview.validRows} />
            <PreviewStat label="Errors" value={state.preview.errorRows} />
            <PreviewStat label="Duplicates" value={state.preview.duplicateRecords} />
          </dl>
          <p className="mt-4 text-sm font-bold text-slate-900">{readyLabel}</p>
          {state.preview.errors.length > 0 ? (
            <div className="mt-4 max-h-48 overflow-auto rounded-md border border-red-100 bg-white p-3">
              {state.preview.errors.slice(0, 20).map((error) => (
                <p key={`${error.row}-${error.identifier}`} className="mb-2 text-xs text-red-700 last:mb-0">
                  Row {error.row} ({error.identifier}): {error.errors.join(" ")}
                </p>
              ))}
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-10 items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={state.loading || state.preview.validRows === 0}
              onClick={() => onConfirm(kind)}
              className="inline-flex min-h-10 items-center rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Import {kind === "products" ? "Products" : "Categories"}
            </button>
          </div>
        </div>
      ) : null}

      {state.result ? (
        <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Successfully imported: {state.result.imported}. Failed: {state.result.failed}.
          {state.result.failed > 0 ? (
            <a className="ml-2 underline" href={`/api/admin/import/error-report/${state.result.historyId}`}>
              Download error report
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function PreviewStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-white p-3">
      <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-black text-slate-950">{value}</dd>
    </div>
  );
}
