/**
 * Timestamp utilities for GraalJS/Maestro runtime
 * Uses native Date.now() which is supported in GraalJS
 */

/**
 * Get current timestamp in milliseconds
 */
export function getTimestamp(): number {
  return Date.now()
}

/**
 * Get current timestamp as string
 */
export function getTimestampString(): string {
  return Date.now().toString()
}

/**
 * Calculate elapsed time from a start timestamp
 */
export function getElapsedTime(startTime: number): number {
  return Date.now() - startTime
}

/**
 * Format timestamp for logging
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString()
}
