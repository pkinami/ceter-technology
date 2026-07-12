import type { Product } from "@/types";
import { company } from "@/lib/company";
import { formatCurrency } from "@/lib/utils";

export const ceterWhatsAppNumber =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? company.whatsappNumber;

export function whatsappUrl(message: string) {
  return `https://wa.me/${ceterWhatsAppNumber}?text=${encodeURIComponent(message)}`;
}

export function productOrderMessage(product: Product) {
  return [
    `Hello ${company.tradingName},`,
    "",
    "I would like to order:",
    product.name,
    "",
    "Price:",
    formatCurrency(product.discountPrice ?? product.price),
    "",
    "Customer name:",
    "",
    "Phone:",
  ].join("\n");
}

export function orderReceivedMessage(orderNumber: string) {
  return `Your order #${orderNumber} has been received.`;
}

export function adminOrderMessage(customerName: string) {
  return `New order received from ${customerName}.`;
}
