import type { AnalyticsEventType } from "@prisma/client";
import type { InputJsonValue } from "@prisma/client/runtime/client.js";
import { prisma } from "@/lib/prisma";

export async function trackAnalyticsEvent(input: {
  eventType: AnalyticsEventType;
  userId?: string | null;
  metadata?: InputJsonValue;
}) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventType: input.eventType,
        userId: input.userId ?? null,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    console.error("Analytics event tracking failed", error);
  }
}

export async function trackProductView(input: {
  productId: string;
  userId?: string | null;
  metadata?: InputJsonValue;
}) {
  try {
    await prisma.$transaction([
      prisma.productView.create({
        data: {
          productId: input.productId,
          userId: input.userId ?? null,
        },
      }),
      prisma.analyticsEvent.create({
        data: {
          eventType: "PRODUCT_VIEW",
          userId: input.userId ?? null,
          metadata: input.metadata ?? { productId: input.productId },
        },
      }),
    ]);
  } catch (error) {
    console.error("Product view tracking failed", error);
  }
}
