"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const schema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  phone: z.string().min(7, "Enter a valid phone number"),
  email: z.email("Enter a valid email"),
  address: z.string().min(8, "Enter a delivery address"),
  payment: z.enum(["mpesa", "card", "cash"]),
});

type CheckoutFormData = z.infer<typeof schema>;

export function CheckoutForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(schema),
    defaultValues: { payment: "mpesa" },
  });

  function onSubmit() {
    reset({ payment: "mpesa" });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Full name
          <input
            {...register("fullName")}
            className="h-12 rounded-md border border-slate-200 px-3 outline-none focus:border-orange-500"
          />
          {errors.fullName ? (
            <span className="text-xs text-red-600">{errors.fullName.message}</span>
          ) : null}
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Phone number
          <input
            {...register("phone")}
            className="h-12 rounded-md border border-slate-200 px-3 outline-none focus:border-orange-500"
          />
          {errors.phone ? (
            <span className="text-xs text-red-600">{errors.phone.message}</span>
          ) : null}
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold">
        Email
        <input
          {...register("email")}
          className="h-12 rounded-md border border-slate-200 px-3 outline-none focus:border-orange-500"
        />
        {errors.email ? (
          <span className="text-xs text-red-600">{errors.email.message}</span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Delivery address
        <textarea
          {...register("address")}
          rows={4}
          className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-orange-500"
        />
        {errors.address ? (
          <span className="text-xs text-red-600">{errors.address.message}</span>
        ) : null}
      </label>
      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold">Payment option</legend>
        {[
          ["mpesa", "M-Pesa"],
          ["card", "Card payment placeholder"],
          ["cash", "Cash on delivery"],
        ].map(([value, label]) => (
          <label
            key={value}
            className="flex items-center gap-3 rounded-md border border-slate-200 p-3 text-sm font-semibold"
          >
            <input
              type="radio"
              value={value}
              {...register("payment")}
              className="accent-orange-500"
            />
            {label}
          </label>
        ))}
      </fieldset>
      {isSubmitSuccessful ? (
        <p className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Order captured. Connect checkout to payments and database in production.
        </p>
      ) : null}
      <Button type="submit" className="w-full md:w-fit">
        Place Order
      </Button>
    </form>
  );
}
