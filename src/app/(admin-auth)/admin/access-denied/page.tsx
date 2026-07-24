import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Access denied",
  description: "The signed-in account is not allowed to use the owner administration area.",
};

export default function AdminAccessDeniedPage() {
  return (
    <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg rounded-md border border-red-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-red-50 text-red-700">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Access denied</p>
            <h1 className="text-2xl font-black text-slate-950">Owner administrator required</h1>
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-600">
          You are authenticated, but this admin workspace is restricted to the single owner administrator.
        </p>
        <Link href="/admin/login" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
          Return to login
        </Link>
      </div>
    </section>
  );
}
