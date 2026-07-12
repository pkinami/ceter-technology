"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImageUp, Loader2, TriangleAlert } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type ImageJob = {
  id: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  progress: number;
  totalItems: number;
  completedItems: number;
  imagesCollected: number;
  errors: number;
  failedRecords: number;
  errorMessage: string | null;
};

type ImageLog = {
  id: string;
  level: string;
  message: string;
  createdAt: string;
};

function numberValue(value: number) {
  return new Intl.NumberFormat("en-KE").format(value);
}

export function ImageAutomationControl({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { showToast, updateToast } = useToast();
  const [job, setJob] = useState<ImageJob | null>(null);
  const [logs, setLogs] = useState<ImageLog[]>([]);
  const [starting, setStarting] = useState(false);
  const [toastId, setToastId] = useState<string | null>(null);
  const running = job?.status === "QUEUED" || job?.status === "RUNNING" || starting;

  useEffect(() => {
    if (!job?.id || !running) {
      return;
    }

    let cancelled = false;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/admin/automation/sync-images?jobId=${job.id}`, { cache: "no-store" });

      if (!response.ok || cancelled) {
        return;
      }

      const payload = await response.json() as { job: ImageJob | null; logs: ImageLog[] };

      if (payload.job) {
        setJob(payload.job);
        setLogs(payload.logs);

        if (toastId) {
          updateToast(toastId, {
            type: payload.job.status === "FAILED" ? "error" : payload.job.status === "COMPLETED" ? "success" : "progress",
            title:
              payload.job.status === "COMPLETED"
                ? "Image automation completed"
                : payload.job.status === "FAILED"
                  ? "Image automation failed"
                  : `Processed ${numberValue(payload.job.completedItems)} of ${numberValue(payload.job.totalItems)} products`,
            message: payload.logs.at(-1)?.message ?? "Image harvesting running...",
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

  async function startImageAutomation() {
    setStarting(true);
    const id = showToast({
      type: "loading",
      title: "Starting image automation",
      message: "Searching product image candidates...",
      progress: 1,
    });
    setToastId(id);

    try {
      const response = await fetch("/api/admin/automation/sync-images", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ limit: 500 }),
      });

      if (!response.ok) {
        throw new Error("Unable to start image automation.");
      }

      const payload = await response.json() as { job: ImageJob };

      setJob(payload.job);
      setLogs([{ id: "started", level: "info", message: "Starting product image automation...", createdAt: new Date().toISOString() }]);
      updateToast(id, {
        type: "progress",
        title: "Image automation running",
        message: "Searching, cleaning, and optimizing product images...",
        progress: payload.job.progress,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Image automation failed to start.";

      updateToast(id, { type: "error", title: "Image automation failed", message });
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className={compact ? "w-full sm:w-auto" : ""}>
      <button
        type="button"
        disabled={running}
        onClick={startImageAutomation}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
      >
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
        {running ? "Harvesting images" : "Sync images"}
      </button>

      {!compact && (job || logs.length > 0) ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4" aria-live="polite">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-black text-slate-950">
              {job?.status === "FAILED" ? (
                <TriangleAlert className="h-4 w-4 text-red-600" />
              ) : job?.status === "COMPLETED" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
              )}
              {job?.status === "COMPLETED" ? "Completed" : job?.status === "FAILED" ? "Failed" : "Image automation running"}
            </div>
            <span className="text-xs font-black text-slate-600">{job?.progress ?? 1}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-slate-950 transition-all duration-500" style={{ width: `${job?.progress ?? 1}%` }} />
          </div>
          {job ? (
            <dl className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-md bg-white p-3">
                <dt className="text-xs font-bold uppercase text-slate-500">Products</dt>
                <dd className="mt-1 text-lg font-black text-slate-950">{numberValue(job.totalItems)}</dd>
              </div>
              <div className="rounded-md bg-white p-3">
                <dt className="text-xs font-bold uppercase text-slate-500">Images</dt>
                <dd className="mt-1 text-lg font-black text-slate-950">{numberValue(job.imagesCollected)}</dd>
              </div>
              <div className="rounded-md bg-white p-3">
                <dt className="text-xs font-bold uppercase text-slate-500">Errors</dt>
                <dd className="mt-1 text-lg font-black text-slate-950">{numberValue(job.errors || job.failedRecords)}</dd>
              </div>
            </dl>
          ) : null}
          {logs.at(-1)?.message ? <p className="mt-3 text-sm font-semibold text-slate-600">{logs.at(-1)?.message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
