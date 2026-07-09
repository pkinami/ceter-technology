"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone number"),
  message: z.string().min(10, "Message should be at least 10 characters"),
});

type ContactFormData = z.infer<typeof schema>;

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful },
  } = useForm<ContactFormData>({
    resolver: zodResolver(schema),
  });

  function onSubmit() {
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      {(["name", "email", "phone"] as const).map((field) => (
        <label key={field} className="grid gap-2 text-sm font-semibold">
          {field === "name" ? "Name" : field === "email" ? "Email" : "Phone"}
          <input
            {...register(field)}
            className="h-12 rounded-md border border-slate-200 px-3 outline-none focus:border-orange-500"
          />
          {errors[field] ? (
            <span className="text-xs text-red-600">{errors[field]?.message}</span>
          ) : null}
        </label>
      ))}
      <label className="grid gap-2 text-sm font-semibold">
        Message
        <textarea
          {...register("message")}
          rows={5}
          className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-orange-500"
        />
        {errors.message ? (
          <span className="text-xs text-red-600">{errors.message.message}</span>
        ) : null}
      </label>
      {isSubmitSuccessful ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          Message captured. Connect this form to email or CRM in production.
        </p>
      ) : null}
      <Button type="submit" className="w-fit">
        <Send className="h-4 w-4" />
        Send Message
      </Button>
    </form>
  );
}
