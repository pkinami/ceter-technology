"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "loading" | "progress";

type ToastInput = {
  id?: string;
  type: ToastType;
  title: string;
  message?: string;
  progress?: number;
  duration?: number;
};

type ToastItem = ToastInput & {
  id: string;
};

type ToastContextValue = {
  showToast: (toast: ToastInput) => string;
  updateToast: (id: string, toast: Partial<ToastInput>) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneByType: Record<ToastType, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  error: "border-red-200 bg-red-50 text-red-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  loading: "border-sky-200 bg-sky-50 text-sky-950",
  progress: "border-orange-200 bg-orange-50 text-orange-950",
};

const iconByType = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  loading: Loader2,
  progress: Info,
};

function createToastId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = toast.id ?? createToastId();
      const item = { ...toast, id };

      setToasts((current) => [item, ...current.filter((existing) => existing.id !== id)].slice(0, 6));

      if (toast.type !== "loading" && toast.type !== "progress") {
        window.setTimeout(() => dismissToast(id), toast.duration ?? 4500);
      }

      return id;
    },
    [dismissToast],
  );

  const updateToast = useCallback(
    (id: string, toast: Partial<ToastInput>) => {
      setToasts((current) => current.map((item) => (item.id === id ? { ...item, ...toast } : item)));

      if (toast.type && toast.type !== "loading" && toast.type !== "progress") {
        window.setTimeout(() => dismissToast(id), toast.duration ?? 4500);
      }
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ showToast, updateToast, dismissToast }), [dismissToast, showToast, updateToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 grid w-[min(420px,calc(100vw-2rem))] gap-3" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = iconByType[toast.type];

          return (
            <div
              key={toast.id}
              className={cn("rounded-lg border p-4 shadow-lg backdrop-blur", toneByType[toast.type])}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", toast.type === "loading" ? "animate-spin" : "")} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black">{toast.title}</p>
                  {toast.message ? <p className="mt-1 text-sm font-semibold opacity-80">{toast.message}</p> : null}
                  {typeof toast.progress === "number" ? (
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
                      <div
                        className="h-full rounded-full bg-current transition-all duration-500"
                        style={{ width: `${Math.max(0, Math.min(100, toast.progress))}%` }}
                      />
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="rounded-md p-1 opacity-70 transition hover:bg-white/60 hover:opacity-100"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
