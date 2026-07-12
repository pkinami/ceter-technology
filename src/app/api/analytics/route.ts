import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  eventType: z.enum(["ADD_TO_CART", "CHECKOUT_STARTED"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`analytics:${key}`, 60);

  if (!limited.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await trackAnalyticsEvent({
    eventType: parsed.data.eventType,
    metadata: parsed.data.metadata as Prisma.InputJsonValue | undefined,
  });

  return NextResponse.json({ ok: true });
}
