/**
 * Parses a createdAt ISO timestamp string to milliseconds.
 *
 * @param createdAt - ISO timestamp string from API
 * @returns Object with parsed timestamp or undefined if invalid
 *
 * @example
 * parseCreatedAt('2024-01-15T10:30:00Z')
 * // => { timestampMs: 1705315800000 }
 *
 * parseCreatedAt('invalid')
 * // => { timestampMs: undefined }
 */
export function parseCreatedAt(createdAt: string): { timestampMs: number | undefined } {
  const parsed = Date.parse(createdAt)
  return {
    timestampMs: Number.isNaN(parsed) ? undefined : parsed,
  }
}

/**
 * Parses createdAt for sorting purposes.
 * Invalid dates return 0, placing them at the end when sorting descending.
 */
export function parseCreatedAtForSort(createdAt: string): number {
  const { timestampMs } = parseCreatedAt(createdAt)
  return timestampMs ?? 0
}
