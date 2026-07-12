export function captureServerError(error: unknown, context?: Record<string, unknown>) {
  if (!process.env.SENTRY_DSN) {
    console.error("Server error", { error, context });
    return;
  }

  console.error("Sentry placeholder", { error, context });
}
