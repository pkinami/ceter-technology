const sensitivePatterns = [
  /api[_-]?key/i,
  /token/i,
  /secret/i,
  /password/i,
  /database/i,
  /prisma/i,
  /postgres/i,
  /supabase/i,
  /stack/i,
  /trace/i,
  /env/i,
];

export function sanitizeOperationMessage(value: unknown, fallback = "The request could not be completed. Please try again."): string {
  const text = typeof value === "string" ? value : value instanceof Error ? value.message : "";
  const compact = text.replace(/\s+/g, " ").trim();

  if (!compact || compact.length > 220 || sensitivePatterns.some((pattern) => pattern.test(compact))) {
    return fallback;
  }

  return compact;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type ImageJobState =
  | "queued"
  | "validating_reference"
  | "generating"
  | "uploading"
  | "validating"
  | "completed"
  | "needs_attention"
  | "failed";

export function imageJobStatusLabel(input: {
  state?: ImageJobState | string | null;
  status?: string | null;
  source?: string | null;
  validationResult?: string | null;
  imageCount?: number;
  targetCount?: number;
  ok?: boolean;
}): string {
  const normalized = String(input.state ?? input.status ?? "").toLowerCase();

  if (normalized.includes("queued")) return "Queued";
  if (normalized.includes("reference")) return "Validating reference";
  if (normalized.includes("upload")) return "Uploading images";
  if (normalized.includes("validat")) return "Validating images";
  if (normalized.includes("complete") || normalized.includes("ready")) return "Completed";
  if (normalized.includes("attention")) return "Needs attention";
  if (normalized.includes("fail") || input.ok === false) return "Failed";
  if (input.imageCount && input.targetCount && input.imageCount < input.targetCount) {
    return `Generating image ${input.imageCount + 1} of ${input.targetCount}`;
  }
  if (String(input.source ?? "").toUpperCase() === "QUEUED") return "Queued";
  if (String(input.validationResult ?? "").toLowerCase().includes("starting")) return "Queued";

  return "Generating images";
}
