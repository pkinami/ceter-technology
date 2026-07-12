"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required.`);
  }

  return value.trim();
}

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function assertEmail(value: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("Enter a valid email address.");
  }

  return value;
}

export async function submitQuoteRequest(formData: FormData) {
  const productId = optionalString(formData, "productId");
  const productInterest = optionalString(formData, "productInterest");

  await prisma.quoteRequest.create({
    data: {
      name: requiredString(formData, "name"),
      company: optionalString(formData, "company"),
      phone: requiredString(formData, "phone"),
      email: assertEmail(requiredString(formData, "email")),
      productInterest,
      message: requiredString(formData, "message"),
      productId,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/homepage");
}
