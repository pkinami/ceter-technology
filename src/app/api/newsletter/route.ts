import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { trackAnalyticsEvent } from "@/lib/analytics";

const schema = z.object({
  email: z.email(),
  source: z.string().trim().max(80).optional(),
});

export async function POST(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for") ?? "local";
  const limited = rateLimit(`newsletter:${key}`, 5);

  if (!limited.ok) {
    return NextResponse.json({ ok: false, message: "Too many requests." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Enter a valid email." }, { status: 400 });
  }

  const subscriber = await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data.email.toLowerCase() },
    update: { source: parsed.data.source ?? "website" },
    create: {
      email: parsed.data.email.toLowerCase(),
      source: parsed.data.source ?? "website",
    },
  });

  await trackAnalyticsEvent({
    eventType: "NEWSLETTER_SUBSCRIBE",
    metadata: { subscriberId: subscriber.id, source: subscriber.source },
  });

  return NextResponse.json({ ok: true });
}
