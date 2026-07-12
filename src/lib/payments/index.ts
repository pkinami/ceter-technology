import { createBankTransferReference } from "./bank";
import { initiateMpesaPayment } from "./mpesa";
import { createStripePaymentIntent } from "./stripe";
import type { PaymentInitInput, PaymentInitResult, PaymentMethod } from "./types";

export type { PaymentInitInput, PaymentInitResult, PaymentMethod };

export async function preparePayment(
  method: PaymentMethod,
  input: PaymentInitInput,
): Promise<PaymentInitResult> {
  if (method === "MPESA") {
    return initiateMpesaPayment(input);
  }

  if (method === "CARD") {
    return createStripePaymentIntent(input);
  }

  if (method === "BANK_TRANSFER") {
    return createBankTransferReference(input);
  }

  return {
    provider: "cash",
    status: "PENDING",
    reference: input.orderNumber,
    message: "Cash on delivery selected. Payment will be collected on delivery.",
  };
}
