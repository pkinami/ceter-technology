import type { Metadata } from "next";
import { Plus, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { DeleteButton } from "../delete-button";
import { createAdminRole, deleteCustomRole } from "../actions";

export const metadata: Metadata = {
  title: "Admin Roles",
  description: "Create and manage CETER Technology admin roles.",
};

export default async function AdminRolesPage() {
  await requirePermission("ROLES", "VIEW");
  const roles = await prisma.userRole.findMany({
    include: {
      permissions: { include: { permission: true } },
      assignments: true,
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-orange-500" />
            <div>
              <h1 className="text-xl font-black text-slate-950">Create custom role</h1>
              <p className="mt-1 text-sm text-slate-500">Custom roles start without permissions until configured.</p>
            </div>
          </div>
          <form action={createAdminRole} className="mt-6 grid gap-4">
            <input name="name" required placeholder="Role name" className="rounded-md border border-slate-300 px-3 py-2" />
            <textarea name="description" rows={4} placeholder="Role responsibilities" className="rounded-md border border-slate-300 px-3 py-2" />
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">
              <Plus className="h-4 w-4" />
              Create role
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Role catalogue</h2>
          <div className="mt-6 grid gap-4">
            {roles.map((role) => (
              <article key={role.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-950">{role.name}</h3>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                        {role.isSystem ? "System role" : "Custom role"}
                      </span>
                      <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-bold text-orange-700">
                        {role.assignments.length} user{role.assignments.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    {role.description ? <p className="mt-2 text-sm text-slate-600">{role.description}</p> : null}
                  </div>
                  {!role.isSystem ? (
                    <form action={deleteCustomRole}>
                      <input type="hidden" name="roleId" value={role.id} />
                      <DeleteButton label={role.name} />
                    </form>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {role.permissions.map((item) => (
                    <span key={item.id} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                      {item.permission.code}
                    </span>
                  ))}
                  {role.permissions.length === 0 ? <span className="text-sm text-slate-500">No permissions assigned.</span> : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
