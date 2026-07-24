"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { trackAnalyticsEvent } from "@/lib/analytics";
import {
  sendAdminOrderNotificationPlaceholder,
  sendOrderConfirmationPlaceholder,
  sendWhatsAppBusinessMessagePlaceholder,
} from "@/lib/notifications";
import { preparePayment, type PaymentMethod } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { adminOrderMessage, orderReceivedMessage } from "@/lib/whatsapp";

const paymentMethods = ["MPESA", "CARD", "BANK_TRANSFER", "CASH_ON_DELIVERY"] as const;

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Enter your full name."),
  customerEmail: z.email("Enter a valid email address."),
  customerPhone: z.string().trim().min(7, "Enter a valid phone number."),
  deliveryAddress: z.string().trim().min(8, "Enter a delivery address."),
  city: z.string().trim().min(2, "Enter a city."),
  country: z.string().trim().min(2, "Enter a country."),
  paymentMethod: z.enum(paymentMethods),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "Add at least one product to your cart."),
});

export type CheckoutPayload = z.infer<typeof checkoutSchema>;

export type CheckoutActionState = {
  ok: boolean;
  orderId?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function orderNumber() {
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

  return `CETER-${stamp}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function trackingNumber() {
  return `TRK-${crypto.randomUUID().slice(0, 10).toUpperCase()}`;
}

export async function createCheckoutOrder(
  payload: CheckoutPayload,
): Promise<CheckoutActionState> {
  const parsed = checkoutSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const user = await getCurrentUser();
  const productIds = data.items.map((item) => item.productId);
  const quantities = new Map(data.items.map((item) => [item.productId, item.quantity]));

  try {
    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          status: "PUBLISHED",
        },
        select: {
          id: true,
          name: true,
          price: true,
          discountPrice: true,
          stock: true,
          status: true,
        },
      });

      if (products.length !== productIds.length) {
        throw new Error("One or more cart products are no longer available.");
      }

      for (const product of products) {
        const quantity = quantities.get(product.id) ?? 0;

        if (product.stock < quantity) {
          throw new Error(`${product.name} has only ${product.stock} item(s) available.`);
        }
      }

      const totalAmount = products.reduce((total, product) => {
        const quantity = quantities.get(product.id) ?? 0;
        const unitPrice = Number((product.discountPrice ?? product.price).toString());

        return total + unitPrice * quantity;
      }, 0);

      const createdOrder = await tx.order.create({
        data: {
          userId: user?.id ?? null,
          orderNumber: orderNumber(),
          trackingNumber: trackingNumber(),
          totalAmount: totalAmount.toFixed(2),
          paymentStatus: "PENDING",
          orderStatus: "PENDING",
          deliveryStatus: "PENDING",
          paymentMethod: data.paymentMethod,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          deliveryAddress: data.deliveryAddress,
          city: data.city,
          country: data.country,
          items: {
            create: products.map((product) => ({
              productId: product.id,
              quantity: quantities.get(product.id) ?? 0,
              price: (product.discountPrice ?? product.price).toString(),
            })),
          },
          payments: {
            create: {
              paymentMethod: data.paymentMethod,
              amount: totalAmount.toFixed(2),
              status: "PENDING",
            },
          },
          statusHistory: {
            create: {
              previousStatus: null,
              newStatus: "PENDING",
              note: "Order created",
            },
          },
        },
      });

      for (const product of products) {
        const quantity = quantities.get(product.id) ?? 0;
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: { decrement: quantity },
          },
          select: { stock: true },
        });

        await tx.stockMovement.create({
          data: {
            productId: product.id,
            orderId: createdOrder.id,
            change: -quantity,
            reason: "Order purchase",
          },
        });
      }

      return createdOrder;
    });

    const payment = await preparePayment(data.paymentMethod as PaymentMethod, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.totalAmount.toString()),
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
    });

    await prisma.payment.updateMany({
      where: { orderId: order.id },
      data: {
        transactionId: payment.reference ?? payment.transactionId ?? null,
        status: payment.status,
      },
    });

    await Promise.all([
      trackAnalyticsEvent({
        eventType: "PURCHASE",
        userId: user?.id ?? null,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: Number(order.totalAmount.toString()),
          paymentMethod: data.paymentMethod,
        },
      }),
      sendOrderConfirmationPlaceholder({
        orderNumber: order.orderNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
      }),
      sendAdminOrderNotificationPlaceholder({
        orderNumber: order.orderNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
      }),
      sendWhatsAppBusinessMessagePlaceholder({
        to: data.customerPhone,
        template: "order_received",
        message: orderReceivedMessage(order.orderNumber),
      }),
      sendWhatsAppBusinessMessagePlaceholder({
        to: process.env.ADMIN_WHATSAPP_NUMBER ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
        template: "admin_new_order",
        message: adminOrderMessage(data.customerName),
      }),
    ]);

    revalidatePath("/products");
    revalidatePath("/orders");
    revalidatePath("/admin/orders");
    revalidatePath("/admin");

    return { ok: true, orderId: order.id };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to create the order. Please try again.",
    };
  }
}
