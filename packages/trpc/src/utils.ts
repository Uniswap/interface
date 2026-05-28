/**
 * Get user's IANA timezone (e.g., "America/New_York").
 * Falls back to "UTC" if unavailable.
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}
