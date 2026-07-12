import type { Metadata } from "next";
import { Database, LockKeyhole, Settings } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { formatDate } from "../utils";

export const metadata: Metadata = {
  title: "Admin Settings",
  description: "Admin settings and operational status for CETER Technology.",
};

export default async function AdminSettingsPage() {
  await requirePermission("SETTINGS", "MANAGE");
  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const storageConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-orange-500" />
            <div>
              <h2 className="text-xl font-black text-slate-950">Admin settings</h2>
              <p className="mt-1 text-sm text-slate-500">
                Security and integration status for the admin dashboard.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-5">
              <div className="flex items-center gap-3">
                <LockKeyhole className="h-5 w-5 text-orange-500" />
                <h3 className="font-black text-slate-950">Admin protection</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                All admin pages use server-side role checks. Admin mutations
                revalidate the current user and role before database writes.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-5">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-orange-500" />
                <h3 className="font-black text-slate-950">Supabase Storage</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Product images upload to the <strong>product-images</strong>{" "}
                bucket and only public URLs are stored in PostgreSQL.
              </p>
              <p className="mt-3 rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                {storageConfigured ? "Supabase environment detected" : "Supabase environment missing"}
              </p>
            </div>
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Admin logs</h2>
          <div className="mt-5 space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <p className="text-sm font-bold text-slate-900">{log.action}</p>
                <p className="mt-1 text-xs text-slate-500">
                {log.actor?.name ?? log.actorName} - {formatDate(log.createdAt)}
                </p>
              </div>
            ))}
            {logs.length === 0 ? (
              <p className="text-sm text-slate-500">No admin actions logged yet.</p>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}
