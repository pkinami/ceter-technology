"use client";

import { Mail } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function NewsletterForm({ source = "website" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function subscribe() {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setMessage(body?.message ?? "Subscription failed.");
        return;
      }

      setEmail("");
      setMessage("Subscribed. You will receive CETER Technology updates.");
    });
  }

  return (
    <form
      className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
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
      <Button type="submit" disabled={isPending}>
        {isPending ? "Subscribing..." : "Subscribe"}
      </Button>
      {message ? (
        <p className="text-sm font-semibold text-slate-600 sm:col-span-2">{message}</p>
      ) : null}
    </form>
  );
}
