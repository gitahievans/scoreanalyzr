const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

// The production API URL is public configuration. Keep a safe default so a
// missing CI build variable can never produce requests to `/undefined/api/*`.
export const API_URL = (
  configuredApiUrl?.trim() || "https://api.scorelearn.site"
).replace(/\/+$/, "");

export async function getApiErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null);
    if (data && typeof data === "object") {
      const message = (data as { error?: unknown; message?: unknown }).error ??
        (data as { error?: unknown; message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
  }

  return `${fallback} (HTTP ${response.status})`;
}
