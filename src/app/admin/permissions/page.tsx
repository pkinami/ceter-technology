import type { Metadata } from "next";
import { Save, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { updateRolePermissions } from "../actions";
import { formatDate } from "../utils";

export const metadata: Metadata = {
  title: "Admin Permissions",
  description: "Manage CETER Technology role permissions and audit activity.",
};

export default async function AdminPermissionsPage() {
  await requirePermission("PERMISSIONS", "VIEW");
  const [roles, permissions, auditLogs] = await Promise.all([
    prisma.userRole.findMany({
      include: { permissions: true },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
    prisma.permission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] }),
    prisma.auditLog.findMany({
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const groupedPermissions = permissions.reduce<Map<string, typeof permissions>>((groups, permission) => {
    const existing = groups.get(permission.module) ?? [];
    existing.push(permission);
    groups.set(permission.module, existing);
    return groups;
  }, new Map());

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-orange-500" />
            <div>
              <h1 className="text-xl font-black text-slate-950">Permission matrix</h1>
              <p className="mt-1 text-sm text-slate-500">Assign module-level permissions to department roles.</p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {roles.map((role) => {
              const selected = new Set(role.permissions.map((item) => item.permissionId));
              const locked = role.slug === "super-admin";

              return (
                <form key={role.id} action={updateRolePermissions} className="rounded-lg border border-slate-200 p-4">
                  <input type="hidden" name="roleId" value={role.id} />
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-black text-slate-950">{role.name}</h2>
                      <p className="text-sm text-slate-500">{locked ? "Full access is locked for safety." : role.description}</p>
                    </div>
                    {!locked ? (
                      <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800">
                        <Save className="h-4 w-4" />
                        Save permissions
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {Array.from(groupedPermissions.entries()).map(([module, modulePermissions]) => (
                      <fieldset key={module} className="rounded-md border border-slate-200 p-3">
                        <legend className="px-1 text-xs font-black uppercase text-slate-500">{module}</legend>
                        <div className="mt-2 grid gap-2">
                          {modulePermissions.map((permission) => (
                            <label key={permission.id} className="flex items-start gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                name="permissionIds"
                                value={permission.id}
                                defaultChecked={selected.has(permission.id)}
                                disabled={locked}
                                className="mt-1 accent-orange-500"
                              />
                              <span>
                                <strong className="text-slate-950">{permission.action.replaceAll("_", " ")}</strong>
                                <span className="block text-xs text-slate-500">{permission.description}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                  </div>
                </form>
              );
            })}
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Audit log</h2>
          <div className="mt-5 space-y-4">
            {auditLogs.map((log) => (
              <div key={log.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <p className="text-sm font-bold text-slate-900">{log.action}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {log.actor?.name ?? log.actorName} - {formatDate(log.createdAt)}
                </p>
                {log.field ? <p className="mt-1 text-xs font-bold text-orange-700">{log.field}</p> : null}
              </div>
            ))}
            {auditLogs.length === 0 ? <p className="text-sm text-slate-500">No audit records yet.</p> : null}
          </div>
        </aside>
      </div>
    </section>
  );
}
