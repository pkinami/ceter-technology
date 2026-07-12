"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  DatabaseZap,
  Factory,
  Loader2,
  PackageCheck,
  PackagePlus,
  PlugZap,
  RefreshCw,
  Save,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type ActionMetric = {
  label: string;
  value: string | number;
};

type AdminActionResult = {
  title?: string;
  message?: string;
  metrics?: ActionMetric[];
} | void;

type AdminActionFormProps = {
  action: (formData: FormData) => Promise<AdminActionResult>;
  children?: ReactNode;
  className?: string;
  buttonClassName?: string;
  idleLabel: string;
  pendingLabel: string;
  icon?: keyof typeof icons;
  progressTitle?: string;
  steps?: string[];
  successTitle?: string;
  successMetrics?: ActionMetric[];
  confirmMessage?: string;
};

const icons = {
  bot: Bot,
  check: PackageCheck,
  database: DatabaseZap,
  factory: Factory,
  package: PackagePlus,
  plug: PlugZap,
  refresh: RefreshCw,
  save: Save,
  sparkles: WandSparkles,
  trash: Trash2,
};

const defaultSteps = [
  "Starting automation",
  "Connecting to data sources",
  "Checking product feeds",
  "Processing records",
  "Updating catalogue data",
  "Publishing changes",
];

export function AdminActionForm({
  action,
  children,
  className,
  buttonClassName,
  idleLabel,
  pendingLabel,
  icon = "sparkles",
  progressTitle = "Automation running",
  steps = defaultSteps,
  successTitle = "Action completed",
  successMetrics = [],
  confirmMessage,
}: AdminActionFormProps) {
  const router = useRouter();
  const { showToast, updateToast } = useToast();
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    title: string;
    message?: string;
    metrics: ActionMetric[];
  } | null>(null);

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    }, 900);

    return () => window.clearInterval(timer);
  }, [running, steps.length]);

  async function run(formData: FormData) {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    setRunning(true);
    setStepIndex(0);
    setError(null);
    setSuccess(null);

    const toastId = showToast({
      type: "loading",
      title: progressTitle,
      message: steps[0] ?? "Starting...",
      progress: 8,
    });

    try {
      const result = await action(formData);
      const metrics = result?.metrics ?? successMetrics;

      setStepIndex(steps.length - 1);
      setSuccess({
        title: result?.title ?? successTitle,
        message: result?.message,
        metrics,
      });
      updateToast(toastId, {
        type: "success",
        title: result?.title ?? successTitle,
        message: result?.message ?? "Completed successfully.",
        progress: 100,
      });
      router.refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The action failed.";

      setError(message);
      updateToast(toastId, {
        type: "error",
        title: "Action failed",
        message,
      });
    } finally {
      setRunning(false);
    }
  }

  const progress = useMemo(() => {
    if (steps.length === 0) return 100;
    return Math.max(8, Math.round(((stepIndex + 1) / steps.length) * 100));
  }, [stepIndex, steps.length]);

  return (
    <form action={run} className={className}>
      {children}
      <PendingButton
        buttonClassName={buttonClassName}
        icon={icon}
        idleLabel={idleLabel}
        pendingLabel={pendingLabel}
      />

      {(running || success || error) ? (
        <div className="mt-4 space-y-3" aria-live="polite">
          {running ? (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-black text-orange-950">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressTitle}
                </div>
                <span className="text-xs font-black text-orange-700">{progress}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-4 grid gap-2">
                {steps.map((step, index) => (
                  <div
                    key={step}
                    className={cn(
                      "flex items-center gap-2 text-sm font-semibold transition-colors",
                      index <= stepIndex ? "text-orange-950" : "text-orange-700/60",
                    )}
                  >
                    {index < stepIndex ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : index === stepIndex ? (
                      <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                    ) : (
                      <span className="h-4 w-4 rounded-full border border-orange-300" />
                    )}
                    {step}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {success ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-black">{success.title}</p>
                  {success.message ? <p className="mt-1 font-semibold">{success.message}</p> : null}
                  {success.metrics.length > 0 ? (
                    <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                      {success.metrics.map((metric) => (
                        <div key={metric.label} className="rounded-md bg-white/70 p-3">
                          <dt className="text-xs font-bold uppercase text-emerald-700">{metric.label}</dt>
                          <dd className="mt-1 text-lg font-black text-emerald-950">{metric.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-black">Action failed</p>
                  <p className="mt-1">Reason: {error}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

function PendingButton({
  buttonClassName,
  icon,
  idleLabel,
  pendingLabel,
}: {
  buttonClassName?: string;
  icon: keyof typeof icons;
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  const Icon = icons[icon];

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-orange-300",
        buttonClassName,
      )}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const tone =
    normalized.includes("FAILED") || normalized.includes("NEEDS")
      ? "border-red-200 bg-red-50 text-red-700"
    : normalized.includes("RUNNING") || normalized.includes("QUEUED")
      ? "border-sky-200 bg-sky-50 text-sky-700"
        : normalized === "COMPLETED" || normalized === "ACTIVE" || normalized.includes("PASSED")
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-black", tone)}>
      {normalized.includes("RUNNING") || normalized.includes("QUEUED") ? (
        <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
      ) : null}
      {status.replaceAll("_", " ").toLowerCase().replace(/^\w/, (item) => item.toUpperCase())}
    </span>
  );
}
