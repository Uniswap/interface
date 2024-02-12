export function formatTimestamp(timestamp: number | undefined, includeYear?: boolean): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    year: includeYear ? 'numeric' : undefined,
  }
  return new Intl.DateTimeFormat('en-US', options).format(timestamp)
}
