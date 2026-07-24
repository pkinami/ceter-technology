"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const schema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone number"),
  message: z.string().min(10, "Message should be at least 10 characters"),
});

type ContactFormData = z.infer<typeof schema>;

export function ContactForm() {
  const { showToast } = useToast();
  const [sending, setSending] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful },
  } = useForm<ContactFormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit() {
    if (sending) return;
    setSending(true);
    try {
      showToast({ type: "success", title: "Message captured", message: "Connect this form to email or CRM in production." });
      reset();
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} aria-busy={sending} className="grid gap-4">
      {(["name", "email", "phone"] as const).map((field) => (
        <label key={field} className="grid gap-2 text-sm font-semibold">
          {field === "name" ? "Name" : field === "email" ? "Email" : "Phone"}
          <input
            {...register(field)}
            className="h-12 rounded-md border border-slate-200 px-3 outline-none focus:border-orange-500"
          />
          {errors[field] ? (
            <span className="text-xs text-red-600" role="alert">{errors[field]?.message}</span>
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
          <span className="text-xs text-red-600" role="alert">{errors.message.message}</span>
        ) : null}
      </label>
      {isSubmitSuccessful ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700" role="status" aria-live="polite">
          Message captured. Connect this form to email or CRM in production.
        </p>
      ) : null}
      <Button type="submit" className="w-fit" disabled={sending}>
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {sending ? "Sending request" : "Send Message"}
      </Button>
    </form>
  );
}
