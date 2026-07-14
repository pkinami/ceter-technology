type LogContext = Record<string, unknown>;

const sensitivePattern = /password|secret|token|key|url|dsn|connection|string/i;

function sanitizeValue(key: string, value: unknown): unknown {
  if (value instanceof Error) {
    return summarizeError(value);
  }

  if (sensitivePattern.test(key)) {
    return value ? "[redacted]" : value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => sanitizeValue(String(index), item));
  }

  if (value && typeof value === "object") {
    return sanitizeContext(value as LogContext);
  }

  return value;
}

export function sanitizeContext(context: LogContext = {}) {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [key, sanitizeValue(key, value)]),
  );
}

export function summarizeError(error: unknown) {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }

  return {
    name: error.name,
    message: error.message,
    code: "code" in error ? String(error.code) : undefined,
    clientVersion: "clientVersion" in error ? String(error.clientVersion) : undefined,
  };
}

export function logServerError(event: string, error: unknown, context: LogContext = {}) {
  console.error(
    JSON.stringify({
      level: "error",
      event,
      error: summarizeError(error),
      context: sanitizeContext(context),
      timestamp: new Date().toISOString(),
    }),
  );
}

export function logServerWarn(event: string, context: LogContext = {}) {
  console.warn(
    JSON.stringify({
      level: "warn",
      event,
      context: sanitizeContext(context),
      timestamp: new Date().toISOString(),
    }),
  );
}
