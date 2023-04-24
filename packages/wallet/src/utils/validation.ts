import { trimToLength } from './string'

export function errorToString(
  error: string | number | Record<string, string>,
  maxLength = 240
): string {
  if (!error) return 'Unknown Error'
  if (typeof error === 'string') return trimToLength(error, maxLength)
  if (typeof error === 'number') return `Error code: ${error}`
  if (error.message) return trimToLength(error.message, maxLength)
  return trimToLength(JSON.stringify(error), maxLength)
}
