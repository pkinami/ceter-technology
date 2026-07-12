export type PaymentMethod = "MPESA" | "CARD" | "BANK_TRANSFER" | "CASH_ON_DELIVERY";

export type PaymentInitInput = {
  orderId: string;
  orderNumber: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

export type PaymentInitResult = {
  provider: string;
  status: "PENDING" | "PAID" | "FAILED";
  transactionId?: string;
  reference?: string;
  message: string;
};
