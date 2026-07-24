"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function PendingSubmitButton({
  idleLabel,
  pendingLabel,
  className,
  icon,
  disabled,
}: {
  idleLabel: string;
  pendingLabel: string;
  className?: string;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300",
        className,
      )}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      <span>{pending ? pendingLabel : idleLabel}</span>
    </button>
  );
}
