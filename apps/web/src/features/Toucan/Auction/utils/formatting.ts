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

/**
 * Formats a Date to a short date+time string: "MM/DD HH:MM"
 * Used for chart axis labels and tooltips.
 */
export function formatShortDateTime(date: Date, options?: { timeZone?: string }): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    hourCycle: 'h23',
    timeZone: options?.timeZone,
  }).formatToParts(date)

  const partValue = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '00'
  const month = partValue('month')
  const day = partValue('day')
  const hours = partValue('hour')
  const minutes = partValue('minute')

  return `${month}/${day} ${hours}:${minutes}`
}
