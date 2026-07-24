"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, CheckCircle2, Copy, Edit3, Eye, ImagePlus, Loader2, RotateCcw, Trash2, X } from "lucide-react";
import { archiveProductById, deleteProductById, duplicateProductById } from "../actions";
import { useToast } from "@/components/ui/toast";

type ValidationIssue = {
  field: string;
  message: string;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  editHref: string;
  imageManagerHref: string;
  storefrontHref: string | null;
  sku: string | null;
  modelNumber: string | null;
  manufacturer: string | null;
  brand: string;
  category: string;
  categoryId: string;
  price: string;
  discountPrice: string;
  stock: number;
  lowStockThreshold: number;
  status: string;
  displayStatus: string;
  validationIssues: ValidationIssue[];
  readyToPublish: boolean;
  badges: string[];
  imageUrl: string | null;
  imageUrls: string[];
  archived: boolean;
  updatedAt: string;
};

type Props = {
  products: ProductRow[];
  totalCount: number;
  pageSize: number;
  readyResultIds: string[];
};

const selectionStorageKey = "ceter-admin-product-selection";

export function ProductManagementTable({ products, totalCount, pageSize, readyResultIds }: Props) {
  const { showToast, updateToast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      const stored = window.localStorage.getItem(selectionStorageKey);
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const [publishing, setPublishing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const readyById = useMemo(() => new Set(products.filter((product) => product.readyToPublish).map((product) => product.id)), [products]);
  const readyResultSet = useMemo(() => new Set(readyResultIds), [readyResultIds]);
  const visibleReadyIds = useMemo(() => products.filter((product) => product.readyToPublish).map((product) => product.id), [products]);
  const selectedReadyProducts = products.filter((product) => selected.has(product.id) && product.readyToPublish);
  const selectedCount = selected.size;
  const visibleSelectedCount = visibleReadyIds.filter((id) => selected.has(id)).length;
  const allVisibleReadySelected = visibleReadyIds.length > 0 && visibleSelectedCount === visibleReadyIds.length;
  const partiallySelected = visibleSelectedCount > 0 && visibleSelectedCount < visibleReadyIds.length;
  const canPublish = selectedCount > 0 && [...selected].every((id) => readyResultSet.has(id)) && !publishing;
  const disabledReason = selectedCount === 0
    ? "Select at least one ready product."
    : ![...selected].every((id) => readyResultSet.has(id))
      ? "Only Ready to Publish products can be published."
      : publishing
        ? "Publishing is already running."
        : "";

  useEffect(() => {
    if (headerCheckboxRef.current) headerCheckboxRef.current.indeterminate = partiallySelected;
  }, [partiallySelected]);

  useEffect(() => {
    try {
      window.localStorage.setItem(selectionStorageKey, JSON.stringify([...selected]));
    } catch {}
  }, [selected]);

  function toggle(id: string, checked: boolean) {
    if (!readyById.has(id)) return;
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function selectVisibleReady(checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      for (const id of visibleReadyIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  function selectAllReadyInResults() {
    setSelected((current) => new Set([...current, ...readyResultIds]));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function publishSelected() {
    if (!canPublish || publishing) return;
    setPublishing(true);
    setConfirming(false);
    const toastId = showToast({ type: "loading", title: "Publishing products", message: `${selectedCount} product${selectedCount === 1 ? "" : "s"} selected.` });
    try {
      const response = await fetch("/api/admin/products/publish-selected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: [...selected] }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; published?: number; failed?: Array<{ id: string; name?: string; errors: string[] }>; message?: string } | null;
      if (!response.ok || !payload?.ok) throw new Error(payload?.message ?? "Publishing failed.");
      const failed = payload.failed ?? [];
      setSelected((current) => {
        const next = new Set(current);
        for (const id of current) {
          if (!failed.some((item) => item.id === id)) next.delete(id);
        }
        return next;
      });
      updateToast(toastId, {
        type: failed.length ? "warning" : "success",
        title: failed.length ? "Publishing partially complete" : "Products published",
        message: failed.length
          ? `${payload.published ?? 0} published. Failed: ${failed.slice(0, 3).map((item) => item.name ?? item.id).join(", ")}${failed.length > 3 ? ` and ${failed.length - 3} more` : ""}.`
          : `${payload.published ?? 0} published.`,
      });
      window.location.reload();
    } catch (error) {
      updateToast(toastId, { type: "error", title: "Publishing failed", message: error instanceof Error ? error.message : "Unable to publish products." });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="relative rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <p className="text-sm font-black text-slate-950">{totalCount.toLocaleString("en-KE")} products match these filters</p>
          <p className="text-xs font-semibold text-slate-500">{selectedCount.toLocaleString("en-KE")} ready product{selectedCount === 1 ? "" : "s"} selected. Page size: {pageSize}.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <button type="button" onClick={() => selectVisibleReady(true)} className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-50">Select all ready shown ({visibleReadyIds.length})</button>
          <button type="button" onClick={selectAllReadyInResults} className="rounded-md border border-orange-300 bg-orange-50 px-3 py-2 text-orange-800 hover:bg-orange-100">Select all ready in results ({readyResultIds.length})</button>
          <button type="button" onClick={clearSelection} className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-50">Deselect all</button>
          <button
            type="button"
            disabled={!canPublish}
            title={disabledReason}
            onClick={() => setConfirming(true)}
            className="inline-flex min-h-9 items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Publish Selected Products
          </button>
        </div>
      </div>
      {disabledReason ? <p className="border-b border-slate-100 px-4 py-2 text-xs font-semibold text-slate-500">{disabledReason}</p> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="sticky left-0 z-20 w-12 bg-slate-50 px-3 py-3">
                <input ref={headerCheckboxRef} aria-label="Select all ready products on current page" type="checkbox" checked={allVisibleReadySelected} onChange={(event) => selectVisibleReady(event.currentTarget.checked)} className="h-4 w-4 accent-orange-500" />
              </th>
              <th className="sticky left-12 z-20 min-w-[340px] bg-slate-50 px-3 py-3">Product</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Stock</th>
              <th className="hidden px-3 py-3 md:table-cell">Category</th>
              <th className="hidden px-3 py-3 lg:table-cell">Brand</th>
              <th className="px-3 py-3">Status</th>
              <th className="hidden px-3 py-3 xl:table-cell">Validation</th>
              <th className="hidden px-3 py-3 2xl:table-cell">Updated</th>
              <th className="sticky right-0 z-20 min-w-[240px] bg-slate-50 px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product.id} className="align-top hover:bg-slate-50/70">
                <td className="sticky left-0 z-10 bg-white px-3 py-3">
                  <input
                    aria-label={product.readyToPublish ? `Select ${product.name}` : `${product.name} has validation errors and cannot be selected for publishing`}
                    type="checkbox"
                    disabled={!product.readyToPublish}
                    checked={selected.has(product.id)}
                    onChange={(event) => toggle(product.id, event.currentTarget.checked)}
                    className="h-4 w-4 accent-orange-500 disabled:cursor-not-allowed"
                  />
                </td>
                <td className="sticky left-12 z-10 bg-white px-3 py-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                      {product.imageUrl ? <Image src={product.imageUrl} alt="" fill sizes="56px" className="object-contain p-1" /> : <div className="grid h-full place-items-center text-[10px] font-black uppercase text-slate-400">No image</div>}
                    </div>
                    <div className="min-w-0">
                      <Link href={product.editHref} className="font-black text-slate-950 hover:text-orange-700">{product.name}</Link>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{product.sku || "No SKU"} - {product.modelNumber || "No model"}</p>
                      {product.validationIssues.length ? (
                        <p className="mt-2 max-w-xl text-xs font-semibold text-red-700">{product.validationIssues.slice(0, 2).map((issue) => issue.message).join(" ")}</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 font-black text-slate-950">{product.discountPrice !== "-" ? <><span>{product.discountPrice}</span><span className="block text-xs text-slate-500 line-through">{product.price}</span></> : product.price}</td>
                <td className="px-3 py-3">
                  <span className={`font-black ${product.stock <= 0 ? "text-red-700" : product.stock <= product.lowStockThreshold ? "text-orange-700" : "text-slate-950"}`}>{product.stock}</span>
                  <span className="block text-xs text-slate-500">Low at {product.lowStockThreshold}</span>
                </td>
                <td className="hidden px-3 py-3 text-slate-600 md:table-cell">{product.category}</td>
                <td className="hidden px-3 py-3 text-slate-600 lg:table-cell">{product.brand || "-"}</td>
                <td className="px-3 py-3"><StatusBadge status={product.displayStatus} /></td>
                <td className="hidden px-3 py-3 xl:table-cell">
                  {product.validationIssues.length ? (
                    <details>
                      <summary className="cursor-pointer text-xs font-black text-red-700">{product.validationIssues.length} error{product.validationIssues.length === 1 ? "" : "s"}</summary>
                      <ul className="mt-2 max-w-xs space-y-1 text-xs font-semibold text-red-700">
                        {product.validationIssues.map((issue) => <li key={`${product.id}-${issue.field}`}>{issue.field}: {issue.message}</li>)}
                      </ul>
                    </details>
                  ) : (
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">Valid</span>
                  )}
                </td>
                <td className="hidden px-3 py-3 text-slate-500 2xl:table-cell">{product.updatedAt}</td>
                <td className="sticky right-0 z-10 bg-white px-3 py-3 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                  <div className="flex flex-wrap gap-2">
                    {product.storefrontHref ? <IconLink href={product.storefrontHref} label="View storefront product" icon={<Eye className="h-4 w-4" />} /> : null}
                    <IconLink href={product.editHref} label="Edit product" icon={<Edit3 className="h-4 w-4" />} />
                    <IconLink href={product.imageManagerHref} label="Manage images" icon={<ImagePlus className="h-4 w-4" />} />
                    <form action={duplicateProductById.bind(null, product.id)}>
                      <button title="Duplicate" aria-label={`Duplicate ${product.name}`} className="grid h-9 min-w-9 place-items-center rounded-md border border-slate-300 bg-white hover:bg-slate-50"><Copy className="h-4 w-4" /></button>
                    </form>
                    <form action={archiveProductById.bind(null, product.id)}>
                      <button title={product.archived ? "Restore from Archived tab" : "Archive"} aria-label={`${product.archived ? "Restore" : "Archive"} ${product.name}`} className="grid h-9 min-w-9 place-items-center rounded-md border border-slate-300 bg-white hover:bg-slate-50">
                        {product.archived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                      </button>
                    </form>
                    <form action={deleteProductById.bind(null, product.id)}>
                      <button title="Delete" aria-label={`Delete ${product.name}`} className="grid h-9 min-w-9 place-items-center rounded-md border border-red-200 bg-white text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 ? (
          <div className="p-8 text-center">
            <Trash2 className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-3 text-sm font-black text-slate-700">No products match these filters.</p>
            <p className="mt-1 text-sm text-slate-500">Clear filters, start an import, or add a draft product.</p>
          </div>
        ) : null}
      </div>

      {confirming ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="publish-products-title">
          <div className="w-full max-w-lg rounded-md bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="publish-products-title" className="text-lg font-black text-slate-950">Publish selected products</h2>
                <p className="mt-1 text-sm text-slate-600">{selectedCount} product{selectedCount === 1 ? "" : "s"} will be published.</p>
              </div>
              <button type="button" onClick={() => setConfirming(false)} className="rounded-md border border-slate-300 p-2" aria-label="Cancel publishing"><X className="h-4 w-4" /></button>
            </div>
            <ul className="mt-4 max-h-52 space-y-2 overflow-auto rounded-md border border-slate-200 p-3 text-sm font-semibold text-slate-700">
              {selectedReadyProducts.slice(0, 8).map((product) => <li key={product.id}>{product.name}</li>)}
              {selectedCount > 8 ? <li>And {selectedCount - 8} more selected product{selectedCount - 8 === 1 ? "" : "s"}.</li> : null}
            </ul>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirming(false)} className="min-h-10 rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={publishSelected} disabled={!canPublish} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                Confirm Publish
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === "Published"
    ? "bg-emerald-50 text-emerald-700"
    : status === "Has Errors"
      ? "bg-red-50 text-red-700"
      : status === "Ready to Publish"
        ? "bg-sky-50 text-sky-700"
        : "bg-orange-50 text-orange-700";
  return <span className={`rounded-md px-2 py-1 text-xs font-black ${tone}`}>{status}</span>;
}

function IconLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} title={label} aria-label={label} className="grid h-9 min-w-9 place-items-center rounded-md border border-slate-300 bg-white hover:bg-slate-50">
      {icon}
    </Link>
  );
}
