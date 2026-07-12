import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runProductDiscoveryEngine } from "@/lib/product-discovery";

type CronJob = "discovery" | "price" | "catalogue";

function jobType(job: CronJob) {
  if (job === "price") {
    return "PRICE_UPDATE" as const;
  }

  if (job === "catalogue") {
    return "CATALOGUE_IMPORT" as const;
  }

  return "MANUFACTURER_SYNC" as const;
}

function scheduleName(job: CronJob) {
  if (job === "price") {
    return "Every 12 hours";
  }

  if (job === "catalogue") {
    return "Weekly";
  }

  return "Daily";
}

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const job = (url.searchParams.get("job") ?? "discovery") as CronJob;

  if (!["discovery", "price", "catalogue"].includes(job)) {
    return NextResponse.json({ error: "Invalid job." }, { status: 400 });
  }

  const startedAt = new Date();
  const automationJob = await prisma.automationJob.create({
    data: {
      name: `${job} automation`,
      type: jobType(job),
      status: "RUNNING",
      schedule: scheduleName(job),
      startedAt,
    },
  });

  try {
    const result = await runProductDiscoveryEngine(prisma);

    await prisma.automationJob.update({
      where: { id: automationJob.id },
      data: {
        status: "COMPLETED",
        recordsRead: result.productsDiscovered,
        productsCreated: result.productsCreated,
        imagesCollected: result.imagesCollected,
        pricesUpdated: result.pricesUpdated,
        failedRecords: result.errors.length,
        missingInfo: {
          errors: result.errors,
          qualityGate: "Products are created only when public source data includes image, category, specifications, and Kenya price evidence.",
        },
        opportunities: {
          sourcesChecked: result.sourcesChecked,
          productsDiscovered: result.productsDiscovered,
          productsUpdated: result.productsUpdated,
          productsCreated: result.productsCreated,
          imagesCollected: result.imagesCollected,
          pricesUpdated: result.pricesUpdated,
        },
        finishedAt: new Date(),
      },
    });

    await prisma.automationLog.create({
      data: {
        automationJobId: automationJob.id,
        level: result.errors.length > 0 ? "warning" : "info",
        message: `${scheduleName(job)} ${job} job completed: ${result.sourcesChecked} sources checked, ${result.productsDiscovered} discovered, ${result.productsCreated} products created.`,
        metadata: result,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown automation error";

    await prisma.automationJob.update({
      where: { id: automationJob.id },
      data: {
        status: "FAILED",
        errorMessage: message,
        finishedAt: new Date(),
      },
    });
    await prisma.automationLog.create({
      data: {
        automationJobId: automationJob.id,
        level: "error",
        message: `${scheduleName(job)} ${job} job failed: ${message}`,
      },
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
