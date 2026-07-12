"use client";

import { Trash2 } from "lucide-react";

export function DeleteButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm"
      onClick={(event) => {
        if (!window.confirm(`Delete ${label}? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </button>
  );
}
