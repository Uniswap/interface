import { trimToLength } from './string'

export function assert(predicate: unknown, errorMessage: string): void {
  if (!predicate) throw new Error(errorMessage)
}

export function errorToString(error: unknown, maxLength = 240): string {
  let errorMessage = ''
  if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  } else if (typeof error === 'number') {
    errorMessage = `Error code: ${error}`
  } else {
    errorMessage = JSON.stringify(error)
  }

  return trimToLength(errorMessage, maxLength)
}
