import type { PaymentInitInput, PaymentInitResult } from "./types";

export async function createBankTransferReference(
  input: PaymentInitInput,
): Promise<PaymentInitResult> {
  return {
    provider: "bank",
    status: "PENDING",
    reference: input.orderNumber,
    message:
      "Bank transfer reference placeholder created. Share bank instructions and reconcile the reference manually.",
  };
}
