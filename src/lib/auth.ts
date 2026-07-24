import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return null;
  }

  return prisma.user.upsert({
    where: { email: user.email },
    update: {
      name:
        user.user_metadata?.name ??
        user.user_metadata?.full_name ??
        user.email.split("@")[0],
    },
    create: {
      id: user.id,
      email: user.email,
      name:
        user.user_metadata?.name ??
        user.user_metadata?.full_name ??
        user.email.split("@")[0],
      role: "CUSTOMER",
    },
  });
});

export async function requireAdmin() {
  const { requireOwnerSuperAdmin } = await import("@/lib/rbac");

  return requireOwnerSuperAdmin();
}
