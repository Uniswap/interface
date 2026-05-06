import { UTCTimestamp } from 'lightweight-charts'

/**
 * Convert milliseconds timestamp to lightweight-charts UTCTimestamp (seconds).
 */
export function toUtcTimestampSeconds(timestampMs: number): UTCTimestamp {
  return Math.floor(timestampMs / 1000) as UTCTimestamp
}

/**
 * Safely parse an ISO timestamp string to milliseconds.
 * Returns undefined if the string is invalid or empty.
 */
export function safeParseTimestampMs(iso: string | undefined): number | undefined {
  if (!iso) {
    return undefined
  }
  const parsed = Date.parse(iso)
  return Number.isFinite(parsed) ? parsed : undefined
}

/**
 * Safely parse a string to an integer.
 * Returns undefined if the string is invalid or empty.
 */
export function safeParseInt(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}
