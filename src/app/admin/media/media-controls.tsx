"use client";

import { Check, Copy, Loader2, UploadCloud } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";

const destinationFolders = {
  "product-images": [
    ["printers", "printers"],
    ["accessories", "accessories"],
    ["office-equipment", "office-equipment"],
  ],
  "website-media": [
    ["banners", "banners"],
    ["brands", "brands"],
    ["promotions", "promotions"],
  ],
  "product-videos": [["products", "products"]],
} as const;

type Bucket = keyof typeof destinationFolders;

export function DestinationFields() {
  const [bucket, setBucket] = useState<Bucket>("product-images");

  return (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Storage bucket
        <select
          name="bucket"
          value={bucket}
          onChange={(event) => setBucket(event.target.value as Bucket)}
          className="rounded-md border border-slate-300 px-3 py-2"
        >
          <option value="product-images">product-images</option>
          <option value="website-media">website-media</option>
          <option value="product-videos">product-videos</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Folder
        <select name="folder" className="rounded-md border border-slate-300 px-3 py-2">
          {destinationFolders[bucket].map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }}
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : "Copy URL"}
    </button>
  );
}

export function UploadSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
      {pending ? "Uploading..." : "Upload media"}
    </button>
  );
}

export function SaveAssignmentButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-9 items-center justify-center rounded-md bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {pending ? "Saving..." : "Assign"}
    </button>
  );
}
