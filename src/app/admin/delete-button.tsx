"use client";

import type { ButtonHTMLAttributes } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DeleteButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  buttonLabel?: string;
  iconOnly?: boolean;
};

export function DeleteButton({ label, buttonLabel = "Delete", iconOnly = false, className, ...props }: DeleteButtonProps) {
  return (
    <button
      type="submit"
      className={cn(
        "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm",
        iconOnly && "h-9 min-h-9 w-9 px-0 py-0",
        className,
      )}
      onClick={(event) => {
        if (!window.confirm(`Delete ${label}? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
      aria-label={iconOnly ? `Delete ${label}` : props["aria-label"]}
      title={iconOnly ? `Delete ${label}` : props.title}
      {...props}
    >
      <Trash2 className="h-4 w-4" />
      {iconOnly ? <span className="sr-only">{buttonLabel}</span> : buttonLabel}
    </button>
  );
}
