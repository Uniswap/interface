import { trimToLength } from 'src/utils/string'

export function assert(predicate: unknown, errorMessage: string) {
  if (!predicate) throw new Error(errorMessage)
}

export function errorToString(error: string | number | Record<string, string>, maxLength = 240) {
  if (!error) return 'Unknown Error'
  if (typeof error === 'string') return trimToLength(error, maxLength)
  if (typeof error === 'number') return `Error code: ${error}`
  if ('message' in error) return trimToLength(error.message, maxLength)
  return trimToLength(JSON.stringify(error), maxLength)
}
