import { trimToLength } from 'src/utils/string'

export function assert(predicate: any, errorMessage: string) {
  if (!predicate) throw new Error(errorMessage)
}

export function errorToString(error: any, maxLength = 240) {
  if (!error) return 'Unknown Error'
  if (typeof error === 'string') return trimToLength(error, maxLength)
  if (typeof error === 'number') return `Error code: ${error}`
  if (error.message) return trimToLength(error.message, maxLength)
  return trimToLength(JSON.stringify(error), maxLength)
}
