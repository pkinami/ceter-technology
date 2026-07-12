import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (webhookSecret && request.headers.get("x-stripe-placeholder-secret") !== webhookSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const payload = body as {
    orderId?: string;
    orderNumber?: string;
    paymentIntentId?: string;
    status?: "succeeded" | "payment_failed" | "processing";
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
