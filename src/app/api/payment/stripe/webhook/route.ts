import { prisma } from "@/lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringField(payload: Record<string, unknown>, key: string) {
  const value = payload[key];

  return typeof value === "string" ? value : undefined;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (webhookSecret && request.headers.get("x-stripe-placeholder-secret") !== webhookSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);

  if (!isRecord(body)) {
    return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const payload = {
    orderId: stringField(body, "orderId"),
    orderNumber: stringField(body, "orderNumber"),
    paymentIntentId: stringField(body, "paymentIntentId"),
    status: stringField(body, "status"),
  };
  const status =
    payload.status === "succeeded"
      ? "PAID"
      : payload.status === "payment_failed"
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
      where: { orderId: order.id, paymentMethod: "CARD" },
      data: {
        status,
        transactionId: payload.paymentIntentId ?? null,
      },
    }),
    prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: status },
    }),
  ]);

  return Response.json({ received: true, status });
}
