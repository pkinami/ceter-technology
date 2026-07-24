"use client";

import { useEffect, useState } from "react";
import { CheckSquare, Square } from "lucide-react";

export function DataSelectionControls({ shownCount }: { shownCount: number }) {
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    const update = () => {
      setSelectedCount(document.querySelectorAll<HTMLInputElement>("[data-managed-record]:checked").length);
    };
    document.addEventListener("change", update);
    update();
    return () => document.removeEventListener("change", update);
  }, []);

  function setAll(checked: boolean) {
    document.querySelectorAll<HTMLInputElement>("[data-managed-record]").forEach((input) => {
      input.checked = checked;
    });
    setSelectedCount(checked ? shownCount : 0);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm" aria-live="polite">
      <button
        type="button"
        onClick={() => setAll(true)}
        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 font-bold text-slate-800 hover:bg-slate-50"
      >
        <CheckSquare className="h-4 w-4" />
        Select page
      </button>
      <button
        type="button"
        onClick={() => setAll(false)}
        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 font-bold text-slate-800 hover:bg-slate-50"
      >
        <Square className="h-4 w-4" />
        Clear
      </button>
      <span className="font-semibold text-slate-600">{selectedCount} selected</span>
    </div>
  );
}
