import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { signOutAdmin } from "@/app/(admin-auth)/admin/login/actions";
import { ownerAdminNav } from "./owner-admin-nav";
import { AdminShell } from "./owner-admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const admin = await requireAdmin();

  return (
    <AdminShell
      adminName={admin.name}
      navItems={ownerAdminNav}
      signOutAction={signOutAdmin}
    >
      {children}
    </AdminShell>
  );
}
