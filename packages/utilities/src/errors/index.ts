import { trimToLength } from 'utilities/src/primitives/string'

export class NotImplementedError extends Error {
  constructor(functionName: string) {
    super(`${functionName}() not implemented. Did you forget a platform override?`)
    this.name = this.constructor.name
  }
}

export function assert(predicate: unknown, errorMessage: string): void {
  if (!predicate) {
    throw new Error(errorMessage)
  }
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
