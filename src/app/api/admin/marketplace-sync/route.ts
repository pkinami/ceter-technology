import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { runProductDiscoveryEngine } from "@/lib/product-discovery";
import { runBulkImageAutomation } from "@/lib/services/imageAutomation";

export const runtime = "nodejs";
export const maxDuration = 300;

function serializeJob(job: Awaited<ReturnType<typeof prisma.automationJob.findUnique>>) {
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    name: job.name,
    status: job.status,
    progress: job.progress,
    totalItems: job.totalItems,
    completedItems: job.completedItems,
    errors: job.errors,
    recordsRead: job.recordsRead,
    productsCreated: job.productsCreated,
    productsUpdated:
      job.opportunities && typeof job.opportunities === "object" && !Array.isArray(job.opportunities)
        ? Number((job.opportunities as Record<string, unknown>).productsUpdated ?? 0)
        : 0,
    imagesCollected: job.imagesCollected,
    pricesUpdated: job.pricesUpdated,
    failedRecords: job.failedRecords,
    errorMessage: job.errorMessage,
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? job.finishedAt?.toISOString() ?? null,
    updatedAt: job.updatedAt.toISOString(),
  };
}

async function log(jobId: string, level: string, message: string, metadata?: Record<string, unknown>) {
  await prisma.automationLog.create({
    data: {
      automationJobId: jobId,
      level,
      message,
      metadata: (metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

async function runMarketplaceSync(jobId: string, adminId: string) {
  try {
    await log(jobId, "info", "Starting marketplace sync...");

    const result = await runProductDiscoveryEngine(prisma, async (progress) => {
      await prisma.automationJob.update({
        where: { id: jobId },
        data: {
          status: "RUNNING",
          progress: progress.progress,
          totalItems: progress.totalItems,
          completedItems: progress.completedItems,
          errors: progress.errors,
          recordsRead: progress.totalItems,
          failedRecords: progress.errors,
        },
      });

      await log(jobId, progress.errors > 0 ? "warning" : "info", progress.stage, progress);
    });

    const failedRecords = result.errors.length;
    await log(jobId, "info", "Starting image harvesting for products missing usable images...");
    const imageResult = await runBulkImageAutomation({
      limit: 500,
      async onProgress(progress) {
        await prisma.automationJob.update({
          where: { id: jobId },
          data: {
            status: "RUNNING",
            totalItems: Math.max(result.productsDiscovered, progress.totalItems),
            imagesCollected: result.imagesCollected + progress.imagesCollected,
            errors: failedRecords + progress.errors,
            failedRecords: failedRecords + progress.errors,
          },
        });
        await log(jobId, progress.errors > 0 ? "warning" : "info", progress.message, progress);
      },
    });
    const totalFailedRecords = failedRecords + imageResult.errors;
    const totalImagesCollected = result.imagesCollected + imageResult.imagesCollected;

    await prisma.automationJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        progress: 100,
        totalItems: result.productsDiscovered,
        completedItems: result.productsDiscovered,
        errors: totalFailedRecords,
        recordsRead: result.productsDiscovered,
        productsCreated: result.productsCreated,
        imagesCollected: totalImagesCollected,
        pricesUpdated: result.pricesUpdated,
        failedRecords: totalFailedRecords,
        missingInfo: {
          errors: result.errors,
          imageErrors: imageResult.results.filter((item) => !item.ok),
          qualityGate: "Products missing image, category, or price remain NEEDS_ATTENTION and are not published.",
        },
        opportunities: {
          sourcesChecked: result.sourcesChecked,
          productsDiscovered: result.productsDiscovered,
          productsUpdated: result.productsUpdated,
          productsCreated: result.productsCreated,
          imagesCollected: totalImagesCollected,
          pricesUpdated: result.pricesUpdated,
        },
        completedAt: new Date(),
        finishedAt: new Date(),
      },
    });

    await log(
      jobId,
      totalFailedRecords > 0 ? "warning" : "info",
      `Completed: ${result.productsDiscovered} discovered, ${result.productsCreated} created, ${result.productsUpdated} updated, ${totalImagesCollected} images collected, ${totalFailedRecords} errors.`,
      { ...result, imageAutomation: imageResult },
    );

    await prisma.adminLog.create({
      data: {
        adminId,
        action: "Synced marketplace with automated product discovery",
      },
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/admin/automation");
    revalidatePath("/admin/products");
    revalidateTag("catalogue", "max");
    revalidateTag("products", "max");
    revalidateTag("categories", "max");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown marketplace sync error";

    await prisma.automationJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        progress: 100,
        errors: 1,
        failedRecords: 1,
        errorMessage: message,
        completedAt: new Date(),
        finishedAt: new Date(),
      },
    });
    await log(jobId, "error", `Marketplace sync failed: ${message}`);
  }
}

export async function POST() {
  const admin = await requirePermission("PRODUCTS", "EDIT");
  const job = await prisma.automationJob.create({
    data: {
      name: "Marketplace Sync",
      type: "MANUFACTURER_SYNC",
      status: "QUEUED",
      schedule: "On demand",
      progress: 1,
      startedAt: new Date(),
    },
  });

  after(() => runMarketplaceSync(job.id, admin.id));

  return NextResponse.json({ job: serializeJob(job) });
}

export async function GET(request: Request) {
  await requirePermission("PRODUCTS", "VIEW");

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  const job = jobId
    ? await prisma.automationJob.findUnique({ where: { id: jobId } })
    : await prisma.automationJob.findFirst({
        where: { type: "MANUFACTURER_SYNC" },
        orderBy: { createdAt: "desc" },
      });

  if (!job) {
    return NextResponse.json({ job: null, logs: [] });
  }

  const logs = await prisma.automationLog.findMany({
    where: { automationJobId: job.id },
    orderBy: { createdAt: "asc" },
    take: 80,
  });

  return NextResponse.json({
    job: serializeJob(job),
    logs: logs.map((item) => ({
      id: item.id,
      level: item.level,
      message: item.message,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}
