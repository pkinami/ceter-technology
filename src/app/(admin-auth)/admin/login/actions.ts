"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

function loginErrorUrl(error: "credentials" | "not-admin" | "missing") {
  return `/admin/login?error=${error}`;
}

export async function signInAdmin(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.trim() === "" ||
    password === ""
  ) {
    redirect(loginErrorUrl("missing"));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error || !data.user?.email) {
    redirect(loginErrorUrl("credentials"));
  }

  const user = await prisma.user.upsert({
    where: { email: data.user.email },
    update: {
      name:
        data.user.user_metadata?.name ??
        data.user.user_metadata?.full_name ??
        data.user.email.split("@")[0],
    },
    create: {
      id: data.user.id,
      email: data.user.email,
      name:
        data.user.user_metadata?.name ??
        data.user.user_metadata?.full_name ??
        data.user.email.split("@")[0],
      role: "CUSTOMER",
    },
  });

  if (user.role !== "ADMIN") {
    await supabase.auth.signOut();
    redirect(loginErrorUrl("not-admin"));
  }

  redirect("/admin");
}

export async function signOutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
