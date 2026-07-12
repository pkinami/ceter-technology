"use client";

import { RefreshCw } from "lucide-react";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black text-slate-950">Something went wrong</h1>
      <p className="mt-3 text-slate-600">
        The page could not finish loading. Try again, or return to the catalogue.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-black text-white transition hover:bg-orange-600"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    </section>
  );
}
