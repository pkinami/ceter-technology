import type { PaymentInitInput, PaymentInitResult } from "./types";

export async function initiateMpesaPayment(
  input: PaymentInitInput,
): Promise<PaymentInitResult> {
  return {
    provider: "mpesa",
    status: "PENDING",
    reference: input.orderNumber,
    message:
      "M-Pesa STK Push placeholder created. Connect Safaricom Daraja credentials to initiate live payments.",
  };
}

export function normalizeMpesaPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("0")) {
    return `254${digits.slice(1)}`;
  }

  if (digits.startsWith("254")) {
    return digits;
  }

  return digits;
}
