export function formatTimestamp(timestamp: number | undefined): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }
  return new Intl.DateTimeFormat('en-US', options).format(timestamp)
}
