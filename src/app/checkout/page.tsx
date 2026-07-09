import type { Metadata } from "next";
import { CheckoutForm } from "@/components/forms/checkout-form";
import { CheckoutSummary } from "./summary";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order with CETER Technology.",
};

export default function CheckoutPage() {
  return (
    <div className="bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-slate-950">Checkout</h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-black">Customer information</h2>
            <CheckoutForm />
          </div>
          <CheckoutSummary />
        </div>
      </section>
    </div>
  );
}
