"use client";

import type { ButtonHTMLAttributes } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type DeleteButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  buttonLabel?: string;
  iconOnly?: boolean;
};

export function DeleteButton({ label, buttonLabel = "Delete", iconOnly = false, className, name, value, disabled, ...props }: DeleteButtonProps) {
  const { pending } = useFormStatus();

  return (
    <>
      {name && value !== undefined ? <input type="hidden" name={name} value={String(value)} /> : null}
      <button
        type="submit"
        disabled={disabled || pending}
        aria-busy={pending}
        className={cn(
          "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60",
          iconOnly && "h-9 min-h-9 w-9 px-0 py-0",
          className,
        )}
        aria-label={iconOnly ? `Delete ${label}` : props["aria-label"]}
        title={iconOnly ? `Delete ${label}` : props.title}
        {...props}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        {iconOnly ? <span className="sr-only">{pending ? "Deleting" : buttonLabel}</span> : pending ? "Deleting" : buttonLabel}
      </button>
    </>
  );
}
