"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Landmark,
  PackageCheck,
  Smartphone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { createCheckoutOrder } from "@/app/checkout/actions";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

const schema = z.object({
  customerName: z.string().min(2, "Enter your full name"),
  customerPhone: z.string().min(7, "Enter a valid phone number"),
  customerEmail: z.email("Enter a valid email"),
  deliveryAddress: z.string().min(8, "Enter a delivery address"),
  city: z.string().min(2, "Enter your city"),
  country: z.string().min(2, "Enter your country"),
  paymentMethod: z.enum(["MPESA", "CARD", "BANK_TRANSFER", "CASH_ON_DELIVERY"]),
});

type CheckoutFormData = z.infer<typeof schema>;
type PaymentOption = {
  value: CheckoutFormData["paymentMethod"];
  label: string;
  Icon: typeof Smartphone;
};

const paymentOptions: PaymentOption[] = [
  { value: "MPESA", label: "M-Pesa", Icon: Smartphone },
  { value: "CARD", label: "Card Payment", Icon: CreditCard },
  { value: "BANK_TRANSFER", label: "Bank Transfer", Icon: Landmark },
  { value: "CASH_ON_DELIVERY", label: "Cash on Delivery", Icon: PackageCheck },
];

export function CheckoutForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { items, clearCart } = useCartStore();
  const {
    register,
    handleSubmit,
    control,
    setError,
    setFocus,
    formState: { errors, isSubmitSuccessful },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: "MPESA", country: "Kenya" },
  });
  const selectedPayment = useWatch({ control, name: "paymentMethod" });

  function onSubmit(values: CheckoutFormData) {
    if (items.length === 0) {
      setError("root", { message: "Add products to your cart before checkout." });
      return;
    }

    startTransition(async () => {
      void fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "CHECKOUT_STARTED",
          metadata: {
            itemCount: items.length,
            paymentMethod: values.paymentMethod,
          },
        }),
      });

      const result = await createCheckoutOrder({
        ...values,
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      });

      if (!result.ok) {
        setError("root", {
          message: result.message ?? "Unable to create the order.",
        });

        if (result.fieldErrors) {
          for (const [key, messages] of Object.entries(result.fieldErrors)) {
            if (messages?.[0] && key in values) {
              setError(key as keyof CheckoutFormData, { message: messages[0] });
            }
          }
        }

        setFocus("customerName");
        return;
      }

      clearCart();
      router.push(`/order-confirmation/${result.orderId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Full name
          <input
            {...register("customerName")}
            className="h-12 rounded-md border border-slate-200 px-3 outline-none focus:border-orange-500"
          />
          {errors.customerName ? (
            <span className="text-xs text-red-600">{errors.customerName.message}</span>
          ) : null}
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Phone number
          <input
            {...register("customerPhone")}
            placeholder="0712 345 678"
            className="h-12 rounded-md border border-slate-200 px-3 outline-none focus:border-orange-500"
          />
          {errors.customerPhone ? (
            <span className="text-xs text-red-600">{errors.customerPhone.message}</span>
          ) : null}
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold">
        Email
        <input
          {...register("customerEmail")}
          type="email"
          className="h-12 rounded-md border border-slate-200 px-3 outline-none focus:border-orange-500"
        />
        {errors.customerEmail ? (
          <span className="text-xs text-red-600">{errors.customerEmail.message}</span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Delivery address
        <textarea
          {...register("deliveryAddress")}
          rows={4}
          className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-orange-500"
        />
        {errors.deliveryAddress ? (
          <span className="text-xs text-red-600">{errors.deliveryAddress.message}</span>
        ) : null}
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          City
          <input
            {...register("city")}
            className="h-12 rounded-md border border-slate-200 px-3 outline-none focus:border-orange-500"
          />
          {errors.city ? (
            <span className="text-xs text-red-600">{errors.city.message}</span>
          ) : null}
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Country
          <input
            {...register("country")}
            className="h-12 rounded-md border border-slate-200 px-3 outline-none focus:border-orange-500"
          />
          {errors.country ? (
            <span className="text-xs text-red-600">{errors.country.message}</span>
          ) : null}
        </label>
      </div>
      {selectedPayment === "MPESA" ? (
        <p className="rounded-md bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-800">
          Use a Safaricom number. Live Daraja STK Push can be connected later.
        </p>
      ) : null}
      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold">Payment method</legend>
        {paymentOptions.map(({ value, label, Icon }) => (
          <label
            key={value}
            className="flex items-center gap-3 rounded-md border border-slate-200 p-3 text-sm font-semibold"
          >
            <input
              type="radio"
              value={value}
              {...register("paymentMethod")}
              className="accent-orange-500"
            />
            <Icon className="h-4 w-4 text-orange-500" />
            {label}
          </label>
        ))}
      </fieldset>
      {errors.root ? (
        <p className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          <AlertCircle className="h-4 w-4" />
          {errors.root.message}
        </p>
      ) : null}
      {isSubmitSuccessful && !errors.root ? (
        <p className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Order received. Redirecting to confirmation.
        </p>
      ) : null}
      <Button type="submit" className="w-full md:w-fit" disabled={isPending}>
        {isPending ? "Placing order..." : "Place Order"}
      </Button>
    </form>
  );
}
