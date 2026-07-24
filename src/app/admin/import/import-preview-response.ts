import type { ImportPreview } from "@/lib/imports";

export type PreviewPayload = {
  success?: boolean;
  error?: string | null;
  details?: unknown;
  preview?: ImportPreview | null;
};

export async function readImportPreviewResponse(response: Response): Promise<PreviewPayload> {
  const text = await response.text();
  const statusLabel = `HTTP ${response.status}`;

  if (!text.trim()) {
    return {
      success: false,
      error: `Import preview failed with ${statusLabel}: the server returned an empty response.`,
      details: null,
      preview: null,
    };
  }

  try {
    const payload = JSON.parse(text) as PreviewPayload;
    if (!response.ok && !payload.error) {
      return {
        success: false,
        error: `Import preview failed with ${statusLabel}.`,
        details: payload,
        preview: null,
      };
    }
    return payload;
  } catch {
    return {
      success: false,
      error: `Import preview failed with ${statusLabel}: the server returned a non-JSON response.`,
      details: text.slice(0, 300),
      preview: null,
    };
  }
}
