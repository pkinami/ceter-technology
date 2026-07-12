export function money(value: { toString(): string } | number | null) {
  if (value === null) {
    return "-";
  }

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(Number(value.toString()));
}

export function formatDate(value: Date) {
  return value.toLocaleDateString("en-KE", {
    dateStyle: "medium",
  });
}

export function specificationsToText(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  return Object.entries(value)
    .map(([key, item]) => `${key}: ${String(item)}`)
    .join("\n");
}
