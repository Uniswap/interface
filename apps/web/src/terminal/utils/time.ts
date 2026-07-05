/**
 * HookSwap Terminal — relative-time formatting.
 *
 * Small dependency-free helper shared by the Portfolio (B5) and Activity (B13)
 * feeds to render transaction timestamps as compact "2m ago" strings, matching
 * the mono timestamps in the design. Input is epoch milliseconds.
 */

/** Format an epoch-ms timestamp as a compact relative string, e.g. "just now", "2m ago", "3h ago", "5d ago". */
export function formatRelativeTime(epochMs: number, nowMs: number = Date.now()): string {
  const deltaSec = Math.max(0, Math.round((nowMs - epochMs) / 1000))
  if (deltaSec < 45) {
    return 'just now'
  }
  const deltaMin = Math.round(deltaSec / 60)
  if (deltaMin < 60) {
    return `${deltaMin}m ago`
  }
  const deltaHr = Math.round(deltaMin / 60)
  if (deltaHr < 24) {
    return `${deltaHr}h ago`
  }
  const deltaDay = Math.round(deltaHr / 24)
  if (deltaDay < 30) {
    return `${deltaDay}d ago`
  }
  const deltaMon = Math.round(deltaDay / 30)
  if (deltaMon < 12) {
    return `${deltaMon}mo ago`
  }
  return `${Math.round(deltaMon / 12)}y ago`
}
