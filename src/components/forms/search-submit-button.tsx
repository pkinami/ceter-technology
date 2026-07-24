"use client";

import { Loader2, Search } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SearchSubmitButton({
  className,
  compact = false,
  idleLabel = "Search",
  pendingLabel = "Searching",
}: {
  className: string;
  compact?: boolean;
  idleLabel?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`inline-flex items-center justify-center gap-2 text-sm font-black disabled:opacity-70 ${className}`}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : compact ? <Search className="h-4 w-4" /> : null}
      <span className={compact ? "sr-only" : ""}>{pending ? pendingLabel : idleLabel}</span>
    </button>
  );
}
