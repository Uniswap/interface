/**
 * Shared URL helpers for analytics modules.
 */

/** Extract the hostname from a URL (e.g. "https://google.com/search?q=..." → "google.com"). */
export function extractDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname
  } catch {
    return undefined
  }
}

/** Strip query params from a URL to avoid leaking PII. */
export function stripQueryParams(url: string): string | undefined {
  try {
    const parsed = new URL(url)
    return `${parsed.origin}${parsed.pathname}`
  } catch {
    return undefined
  }
}
