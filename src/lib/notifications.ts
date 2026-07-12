type OrderNotificationInput = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

export type WhatsAppBusinessPayload = {
  to: string;
  message: string;
  template?: string;
};

export async function sendWhatsAppBusinessMessagePlaceholder(
  payload: WhatsAppBusinessPayload,
) {
  console.info(
    `WhatsApp Business API placeholder: ${payload.template ?? "message"} to ${payload.to}: ${payload.message}`,
  );
}

export async function sendOrderConfirmationPlaceholder(
  input: OrderNotificationInput,
) {
  console.info(
    `Customer notification placeholder: Your CETER Technology order has been received. Order ${input.orderNumber} for ${input.customerName}.`,
  );
}

export async function sendAdminOrderNotificationPlaceholder(
  input: OrderNotificationInput,
) {
  console.info(
    `Admin notification placeholder: New order received. Order ${input.orderNumber} from ${input.customerName} (${input.customerPhone}, ${input.customerEmail}).`,
  );
}
