/**
 * Utility functions for formatting dates and timestamps in the Toucan Auction context
 */

/**
 * Formats a Unix timestamp (in seconds) to a localized date string in MM/DD/YYYY format.
 * Uses Intl.DateTimeFormat to respect the user's locale for date ordering.
 * @param timestamp - Unix timestamp in seconds (bigint)
 * @returns Formatted date string (e.g., "11/13/2025" for en-US, "13/11/2025" for en-GB)
 */
export function formatTimestampToDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000)
  return date.toLocaleDateString(undefined, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })
}
