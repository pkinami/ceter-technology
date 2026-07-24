"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { sanitizeOperationMessage } from "@/lib/feedback";

export function PublicActionForm({
  action,
  children,
  className,
  pendingLabel,
  successMessage,
  errorFallback,
}: {
  action: (formData: FormData) => Promise<void>;
  children: ReactNode;
  className?: string;
  pendingLabel: string;
  successMessage: string;
  errorFallback?: string;
}) {
  const { showToast, updateToast } = useToast();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function submit(formData: FormData) {
    if (pending) return;

    setPending(true);
    setMessage(null);
    const toastId = showToast({ type: "loading", title: pendingLabel, message: "Please wait while we send your request." });

    try {
      await action(formData);
      setMessage({ type: "success", text: successMessage });
      updateToast(toastId, { type: "success", title: "Request sent", message: successMessage });
    } catch (error) {
      const text = sanitizeOperationMessage(error, errorFallback ?? "Unable to send the request. Please try again.");
      setMessage({ type: "error", text });
      updateToast(toastId, { type: "error", title: "Request failed", message: text });
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={submit} aria-busy={pending} className={className}>
      {children}
      {pending ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-orange-700" role="status" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingLabel}
        </p>
      ) : null}
      {message ? (
        <div
          className={
            message.type === "success"
              ? "flex gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"
              : "flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"
          }
          role={message.type === "error" ? "alert" : "status"}
          aria-live={message.type === "error" ? "assertive" : "polite"}
        >
          {message.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
          {message.text}
        </div>
      ) : null}
    </form>
  );
}
