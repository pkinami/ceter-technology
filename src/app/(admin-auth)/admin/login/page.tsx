import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { signInAdmin } from "./actions";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Sign in to the CETER Technology admin dashboard.",
};

type Props = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const errors: Record<string, string> = {
  credentials: "Use a valid admin email and password.",
  missing: "Enter your email and password.",
  "not-admin": "That account is not allowed to access the admin dashboard.",
  "not-authorized": "That account does not have permission to access this admin page.",
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const errorMessage = error ? errors[error] : null;

  return (
    <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-slate-950 text-orange-300">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
              CETER Technology
            </p>
            <h1 className="text-2xl font-black text-slate-950">Admin login</h1>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <form action={signInAdmin} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-slate-800">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="min-h-11 rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-800">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="min-h-11 rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </label>
          <button className="mt-2 inline-flex min-h-11 items-center justify-center rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">
            Sign in
          </button>
        </form>

        <Link
          href="/"
          className="mt-5 inline-flex text-sm font-semibold text-slate-600 hover:text-orange-600"
        >
          Return to storefront
        </Link>
      </div>
    </section>
  );
}
