"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, TriangleAlert, WandSparkles } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type SyncJob = {
  id: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  progress: number;
  totalItems: number;
  completedItems: number;
  errors: number;
  recordsRead: number;
  productsCreated: number;
  productsUpdated: number;
  imagesCollected: number;
  pricesUpdated: number;
  failedRecords: number;
  errorMessage: string | null;
};

type SyncLog = {
  id: string;
  level: string;
  message: string;
  createdAt: string;
};

const steps = [
  "Starting marketplace sync",
  "Connecting to data sources",
  "Checking manufacturer catalogues",
  "Extracting products",
  "Matching duplicates",
  "Generating descriptions",
  "Collecting images",
  "Calculating Kenya prices",
  "Publishing products",
];

function numberValue(value: number) {
  return new Intl.NumberFormat("en-KE").format(value);
}

function activeStep(logs: SyncLog[]) {
  const text = logs.map((item) => item.message).join(" ").toLowerCase();
  let index = 0;

  for (const [stepIndex, step] of steps.entries()) {
    if (text.includes(step.replace("manufacturer ", "").toLowerCase().replace(" catalogues", ""))) {
      index = stepIndex;
    }
  }

  return index;
}

export function MarketplaceSyncControl() {
  const router = useRouter();
  const { showToast, updateToast } = useToast();
  const [job, setJob] = useState<SyncJob | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [starting, setStarting] = useState(false);
  const [toastId, setToastId] = useState<string | null>(null);
  const running = job?.status === "QUEUED" || job?.status === "RUNNING" || starting;
  const currentStep = useMemo(() => activeStep(logs), [logs]);

  useEffect(() => {
    if (!job?.id || !running) {
      return;
    }

    let cancelled = false;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/admin/marketplace-sync?jobId=${job.id}`, { cache: "no-store" });

      if (!response.ok || cancelled) {
        return;
      }

      const payload = await response.json() as { job: SyncJob | null; logs: SyncLog[] };

      if (payload.job) {
        setJob(payload.job);
        setLogs(payload.logs);

        if (toastId) {
          updateToast(toastId, {
            type: payload.job.status === "FAILED" ? "error" : payload.job.status === "COMPLETED" ? "success" : "progress",
            title:
              payload.job.status === "COMPLETED"
                ? "Marketplace sync completed"
                : payload.job.status === "FAILED"
                  ? "Marketplace sync failed"
                  : `Processing ${numberValue(payload.job.completedItems)} of ${numberValue(payload.job.totalItems)} products`,
            message: payload.logs.at(-1)?.message ?? "Sync running...",
            progress: payload.job.progress,
          });
        }

        if (payload.job.status === "COMPLETED" || payload.job.status === "FAILED") {
          window.clearInterval(timer);
          router.refresh();
        }
      }
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [job?.id, running, router, toastId, updateToast]);

  async function startSync() {
    setStarting(true);
    const id = showToast({
      type: "loading",
      title: "Starting marketplace sync",
      message: "Connecting to data sources...",
      progress: 1,
    });
    setToastId(id);

    try {
      const response = await fetch("/api/admin/marketplace-sync", { method: "POST" });

      if (!response.ok) {
        throw new Error("Unable to start marketplace sync.");
      }

      const payload = await response.json() as { job: SyncJob };

      setJob(payload.job);
      setLogs([{ id: "started", level: "info", message: "Starting marketplace sync...", createdAt: new Date().toISOString() }]);
      updateToast(id, {
        type: "progress",
        title: "Marketplace sync running",
        message: "Processing public product sources...",
        progress: payload.job.progress,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Marketplace sync failed to start.";

      updateToast(id, { type: "error", title: "Marketplace sync failed", message });
    } finally {
      setStarting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={running}
        onClick={startSync}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-orange-500 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-orange-300"
      >
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
        {running ? `Syncing ${numberValue(job?.totalItems ?? 0)} products` : "Sync marketplace"}
      </button>

      {(job || logs.length > 0) ? (
        <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4" aria-live="polite">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-black text-orange-950">
              {job?.status === "FAILED" ? (
                <TriangleAlert className="h-4 w-4 text-red-600" />
              ) : job?.status === "COMPLETED" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
              )}
              {job?.status === "COMPLETED" ? "Completed" : job?.status === "FAILED" ? "Failed" : "Marketplace sync running"}
            </div>
            <span className="text-xs font-black text-orange-700">{job?.progress ?? 1}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-orange-500 transition-all duration-500" style={{ width: `${job?.progress ?? 1}%` }} />
          </div>
          <div className="mt-4 grid gap-2">
            {steps.map((step, index) => (
              <div
                key={step}
                className={cn(
                  "flex items-center gap-2 text-sm font-semibold transition-colors",
                  index <= currentStep || job?.status === "COMPLETED" ? "text-orange-950" : "text-orange-700/60",
                )}
              >
                {index < currentStep || job?.status === "COMPLETED" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : index === currentStep && running ? (
                  <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-orange-300" />
                )}
                {step}
              </div>
            ))}
          </div>

          {job ? (
            <dl className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md bg-white/70 p-3">
                <dt className="text-xs font-bold uppercase text-orange-700">Discovered</dt>
                <dd className="mt-1 text-lg font-black text-orange-950">{numberValue(job.recordsRead || job.totalItems)}</dd>
              </div>
              <div className="rounded-md bg-white/70 p-3">
                <dt className="text-xs font-bold uppercase text-orange-700">Created</dt>
                <dd className="mt-1 text-lg font-black text-orange-950">{numberValue(job.productsCreated)}</dd>
              </div>
              <div className="rounded-md bg-white/70 p-3">
                <dt className="text-xs font-bold uppercase text-orange-700">Updated</dt>
                <dd className="mt-1 text-lg font-black text-orange-950">{numberValue(job.productsUpdated)}</dd>
              </div>
              <div className="rounded-md bg-white/70 p-3">
                <dt className="text-xs font-bold uppercase text-orange-700">Errors</dt>
                <dd className="mt-1 text-lg font-black text-orange-950">{numberValue(job.errors || job.failedRecords)}</dd>
              </div>
            </dl>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
