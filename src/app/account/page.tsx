import type { Metadata } from "next";
import { connection } from "next/server";
import { UserRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account",
  description: "Customer account links for CETER Technologies.",
};

export default async function AccountPage() {
  await connection();
  const user = await getCurrentUser();

  return (
    <div className="bg-slate-50">
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <UserRound className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-orange-600">Account</p>
              <h1 className="text-3xl font-black text-slate-950">{user ? user.name : "Customer account"}</h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            {user ? "View your orders and continue shopping from the customer catalogue." : "Use checkout to create orders. Signed-in customers can view order history."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/orders">Orders</ButtonLink>
            <ButtonLink href="/track-order" variant="outline">Track Order</ButtonLink>
            <ButtonLink href="/products" variant="outline">Shop Products</ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
