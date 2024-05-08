export enum FormatType {
  Short = 'short',
  Long = 'long',
}

export function formatTimestamp(timestamp: number | undefined, includeYear?: boolean, type = FormatType.Long): string {
  const options: Intl.DateTimeFormatOptions =
    type === FormatType.Long
      ? {
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
          year: includeYear ? 'numeric' : undefined,
        }
      : {
          year: includeYear ? '2-digit' : undefined,
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }

  return new Intl.DateTimeFormat('en-US', options).format(timestamp)
}
