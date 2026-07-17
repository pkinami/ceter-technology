"use client";

import { useState } from "react";

export function ProductBulkControls({
  shownCount,
  totalCount,
}: {
  shownCount: number;
  totalCount: number;
}) {
  const [allFiltered, setAllFiltered] = useState(false);

  function setCurrentPageSelection(checked: boolean) {
    document
      .querySelectorAll<HTMLInputElement>('input[data-product-select="true"]')
      .forEach((input) => {
        input.checked = checked;
      });
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 rounded-md border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          className="accent-orange-500"
          onChange={(event) => setCurrentPageSelection(event.currentTarget.checked)}
        />
        Select {shownCount} shown
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="selectionMode"
          value="allFiltered"
          checked={allFiltered}
          onChange={(event) => setAllFiltered(event.currentTarget.checked)}
          className="accent-orange-500"
        />
        Select all {totalCount} matching filters
      </label>
      {allFiltered ? (
        <span className="text-xs font-bold uppercase text-red-700">
          Bulk action applies to every matching product, not just this page.
        </span>
      ) : null}
    </div>
  );
}
