"use client";

import { Loader2, Mail } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { sanitizeOperationMessage } from "@/lib/feedback";

export function NewsletterForm({ source = "website" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast, updateToast } = useToast();

  function subscribe() {
    if (running || isPending) return;
    setMessage(null);
    setRunning(true);
    const toastId = showToast({ type: "loading", title: "Sending request", message: "Subscribing email address." });
    startTransition(async () => {
      try {
        const response = await fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, source }),
        });
        const body = (await response.json().catch(() => null)) as { message?: string } | null;

        if (!response.ok) {
          const text = sanitizeOperationMessage(body?.message, "Subscription failed. Please try again.");
          setMessage(text);
          updateToast(toastId, { type: "error", title: "Subscription failed", message: text });
          return;
        }

        setEmail("");
        setMessage("Subscribed. You will receive CETER Technology updates.");
        updateToast(toastId, { type: "success", title: "Subscribed", message: "You will receive CETER Technology updates." });
      } catch (error) {
        const text = sanitizeOperationMessage(error, "Subscription failed. Please try again.");
        setMessage(text);
        updateToast(toastId, { type: "error", title: "Subscription failed", message: text });
      } finally {
        setRunning(false);
      }
    });
  }

  const busy = running || isPending;

  return (
    <form
      className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
      aria-busy={busy}
      onSubmit={(event) => {
        event.preventDefault();
        subscribe();
      }}
    >
      <label className="sr-only" htmlFor="newsletter-email">
        Email address
      </label>
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          className="h-12 w-full rounded-md border border-slate-300 pl-10 pr-3 text-slate-950 outline-none focus:border-orange-500"
        />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? "Sending request" : "Subscribe"}
      </Button>
      {message ? (
        <p className="text-sm font-semibold text-slate-600 sm:col-span-2" role="status" aria-live="polite">{message}</p>
      ) : null}
    </form>
  );
}
