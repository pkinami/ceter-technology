import type { Metadata } from "next";
import { Plus, Save, Trash2, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { createUserRecord, removeUserRole, updateUserRole } from "../actions";
import { formatDate } from "../utils";

export const metadata: Metadata = {
  title: "Admin Users",
  description: "Manage CETER Technology admin users and role assignments.",
};

export default async function AdminUsersPage() {
  await requirePermission("USERS", "VIEW");
  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      include: { roleAssignments: { include: { role: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userRole.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-orange-500" />
            <div>
              <h1 className="text-xl font-black text-slate-950">Add user</h1>
              <p className="mt-1 text-sm text-slate-500">Create a local user record and optionally assign an admin role.</p>
            </div>
          </div>
          <form action={createUserRecord} className="mt-6 grid gap-4">
            <input name="name" required placeholder="Full name" className="rounded-md border border-slate-300 px-3 py-2" />
            <input name="email" type="email" required placeholder="Email address" className="rounded-md border border-slate-300 px-3 py-2" />
            <select name="roleId" defaultValue="" className="rounded-md border border-slate-300 px-3 py-2">
              <option value="">No admin role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">
              <Plus className="h-4 w-4" />
              Add user
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Users and assigned roles</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">Joined</th>
                  <th className="py-3 pr-4">Roles</th>
                  <th className="py-3">Assign role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="py-4 pr-4">
                      <p className="font-bold text-slate-950">{user.name}</p>
                      <p className="text-slate-500">{user.email}</p>
                    </td>
                    <td className="py-4 pr-4 text-slate-500">{formatDate(user.createdAt)}</td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        {user.roleAssignments.map((assignment) => (
                          <form key={assignment.id} action={removeUserRole}>
                            <input type="hidden" name="assignmentId" value={assignment.id} />
                            <button className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700">
                              {assignment.role.name}
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </form>
                        ))}
                        {user.roleAssignments.length === 0 ? <span className="text-slate-500">Customer only</span> : null}
                      </div>
                    </td>
                    <td className="py-4">
                      <form action={updateUserRole} className="flex gap-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <select name="roleId" className="rounded-md border border-slate-300 px-3 py-2">
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))}
                        </select>
                        <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800">
                          <Save className="h-4 w-4" />
                          Assign
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
