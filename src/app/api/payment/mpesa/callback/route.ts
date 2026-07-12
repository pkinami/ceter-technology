import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const callbackSecret = process.env.PAYMENT_CALLBACK_SECRET;

  if (callbackSecret && request.headers.get("x-ceter-payment-secret") !== callbackSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid callback payload" }, { status: 400 });
  }

  const payload = body as {
    orderId?: string;
    orderNumber?: string;
    transactionId?: string;
    status?: "SUCCESS" | "FAILED" | "PENDING";
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
