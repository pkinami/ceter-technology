import type { PaymentInitInput, PaymentInitResult } from "./types";

export async function createStripePaymentIntent(
  input: PaymentInitInput,
): Promise<PaymentInitResult> {
  return {
    provider: "stripe",
    status: "PENDING",
    reference: input.orderNumber,
    message:
      "Stripe payment intent placeholder created. Add Stripe keys and confirm the client secret in the checkout UI.",
  };
}
