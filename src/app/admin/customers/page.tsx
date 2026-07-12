import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { formatDate, money } from "../utils";

export const metadata: Metadata = {
  title: "Admin Customers",
  description: "View customers and manage CETER Technology user roles.",
};

export default async function AdminCustomersPage() {
  const admin = await requirePermission("CUSTOMERS", "VIEW");
  const users = await prisma.user.findMany({
    include: {
      orders: true,
      roleAssignments: { include: { role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-orange-500" />
          <div>
            <h2 className="text-xl font-black text-slate-950">Customers and admins</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review customer accounts. Role assignment has moved to the dedicated user management page.
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Orders</th>
                <th className="py-3 pr-4">Total spent</th>
                <th className="py-3 pr-4">Joined</th>
                <th className="py-3">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => {
                const totalSpent = user.orders.reduce(
                  (sum, order) => sum + Number(order.totalAmount.toString()),
                  0,
                );

                return (
                  <tr key={user.id}>
                    <td className="py-4 pr-4 font-bold text-slate-950">
                      {user.name}
                      {user.id === admin.id ? (
                        <span className="ml-2 rounded-md bg-orange-50 px-2 py-1 text-xs font-bold text-orange-700">
                          You
                        </span>
                      ) : null}
                    </td>
                    <td className="py-4 pr-4 text-slate-600">{user.email}</td>
                    <td className="py-4 pr-4 text-slate-600">{user.orders.length}</td>
                    <td className="py-4 pr-4 font-bold text-slate-950">{money(totalSpent)}</td>
                    <td className="py-4 pr-4 text-slate-500">{formatDate(user.createdAt)}</td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.roleAssignments.map((assignment) => (
                          <span key={assignment.id} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                            {assignment.role.name}
                          </span>
                        ))}
                        {user.roleAssignments.length === 0 ? (
                          <span className="text-sm text-slate-500">Customer</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 ? (
            <p className="py-6 text-sm text-slate-500">No users yet.</p>
          ) : null}
        </div>
      </div>
      {admin.permissions.has("users.view") ? (
        <Link href="/admin/users" className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
          Manage admin users
        </Link>
      ) : null}
    </section>
  );
}
