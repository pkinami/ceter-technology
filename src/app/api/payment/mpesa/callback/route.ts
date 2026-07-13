import { prisma } from "@/lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringField(payload: Record<string, unknown>, key: string) {
  const value = payload[key];

  return typeof value === "string" ? value : undefined;
}

export async function POST(request: Request) {
  const callbackSecret = process.env.PAYMENT_CALLBACK_SECRET;

  if (callbackSecret && request.headers.get("x-ceter-payment-secret") !== callbackSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);

  if (!isRecord(body)) {
    return Response.json({ error: "Invalid callback payload" }, { status: 400 });
  }

  const payload = {
    orderId: stringField(body, "orderId"),
    orderNumber: stringField(body, "orderNumber"),
    transactionId: stringField(body, "transactionId"),
    status: stringField(body, "status"),
  };
  const status =
    payload.status === "SUCCESS"
      ? "PAID"
      : payload.status === "FAILED"
        ? "FAILED"
        : "PENDING";

  const order = payload.orderId
    ? await prisma.order.findUnique({ where: { id: payload.orderId } })
    : payload.orderNumber
      ? await prisma.order.findUnique({ where: { orderNumber: payload.orderNumber } })
      : null;

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.payment.updateMany({
      where: { orderId: order.id, paymentMethod: "MPESA" },
      data: {
        status,
        transactionId: payload.transactionId ?? null,
      },
    }),
    prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: status },
    }),
  ]);

  return Response.json({ received: true, status });
}
