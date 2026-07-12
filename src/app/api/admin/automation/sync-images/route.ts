import { revalidatePath, revalidateTag } from "next/cache";
import { after, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
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

async function runImageJob(jobId: string, adminId: string, limit: number) {
  try {
    await log(jobId, "info", "Starting product image automation...");

    const result = await runBulkImageAutomation({
      limit,
      async onProgress(progress) {
        const percent = progress.totalItems > 0
          ? Math.max(1, Math.round((progress.completedItems / progress.totalItems) * 100))
          : 100;

        await prisma.automationJob.update({
          where: { id: jobId },
          data: {
            status: "RUNNING",
            progress: percent,
            totalItems: progress.totalItems,
            completedItems: progress.completedItems,
            recordsRead: progress.totalItems,
            imagesCollected: progress.imagesCollected,
            errors: progress.errors,
            failedRecords: progress.errors,
          },
        });

        await log(jobId, progress.errors > 0 ? "warning" : "info", progress.message, {
          productId: progress.productId,
          totalItems: progress.totalItems,
          completedItems: progress.completedItems,
          imagesCollected: progress.imagesCollected,
          errors: progress.errors,
        });
      },
    });

    await prisma.automationJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        progress: 100,
        totalItems: result.totalItems,
        completedItems: result.completedItems,
        recordsRead: result.totalItems,
        imagesCollected: result.imagesCollected,
        errors: result.errors,
        failedRecords: result.errors,
        missingInfo: {
          failedProducts: result.results.filter((item) => !item.ok),
        },
        opportunities: {
          successfulProducts: result.results.filter((item) => item.ok).length,
          failedProducts: result.errors,
        },
        completedAt: new Date(),
        finishedAt: new Date(),
      },
    });

    await log(
      jobId,
      result.errors > 0 ? "warning" : "info",
      `Image automation completed: ${result.imagesCollected} images collected, ${result.errors} errors.`,
      result,
    );

    await prisma.adminLog.create({
      data: {
        adminId,
        action: `Ran product image automation for ${result.totalItems} products`,
      },
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/admin/automation");
    revalidatePath("/admin/product-ai");
    revalidatePath("/admin/products");
    revalidateTag("catalogue", "max");
    revalidateTag("products", "max");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown image automation error";

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
    await log(jobId, "error", `Product image automation failed: ${message}`);
  }
}

export async function POST(request: Request) {
  const admin = await requirePermission("PRODUCTS", "EDIT");
  const body = await request.json().catch(() => ({})) as { limit?: unknown };
  const limit = typeof body.limit === "number" && Number.isFinite(body.limit)
    ? Math.max(1, Math.min(500, Math.floor(body.limit)))
    : 500;
  const job = await prisma.automationJob.create({
    data: {
      name: "Product Image Automation",
      type: "IMAGE_COLLECTION",
      status: "QUEUED",
      schedule: "On demand",
      progress: 1,
      startedAt: new Date(),
    },
  });

  after(() => runImageJob(job.id, admin.id, limit));

  return NextResponse.json({ job: serializeJob(job) });
}

export async function GET(request: Request) {
  await requirePermission("PRODUCTS", "VIEW");

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  const job = jobId
    ? await prisma.automationJob.findUnique({ where: { id: jobId } })
    : await prisma.automationJob.findFirst({
        where: { type: "IMAGE_COLLECTION" },
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
