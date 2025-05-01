import { trimToLength } from 'utilities/src/primitives/string'

export class PlatformSplitStubError extends Error {
  constructor(functionName: string) {
    super(`${functionName} not implemented. Did you forget a platform override?`)
    this.name = this.constructor.name
  }
}

export class NotImplementedError extends Error {
  constructor(functionName: string) {
    super(`${functionName} is not implemented on this platform.`)
    this.name = this.constructor.name
  }
}

export function assert<T>(predicate: T | null | undefined, errorMessage: string): asserts predicate is T {
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

type TryCatchResult<T> = { data: T; error: null } | { data: null; error: Error }
/**
 * Executes a function or awaits a promise, returning a tuple containing either the result or an error.
 *
 * @param valueFnOrPromise - Function to execute or promise to await that may throw an error
 * @returns A tuple where the first element is the function result (or undefined if error occurred)
 *          and the second element is the error (or null if successful)
 * @example
 * const [value, error] = tryCatch(() => JSON.parse(jsonString));
 * if (error) {
 *   console.error('Failed to parse JSON:', error);
 * }
 */
export function tryCatch<T>(valueFnOrPromise: Promise<T>): Promise<TryCatchResult<T>>
export function tryCatch<T>(valueFnOrPromise: () => T): TryCatchResult<T>
export function tryCatch<T>(valueFnOrPromise: Promise<T> | (() => T)): TryCatchResult<T> | Promise<TryCatchResult<T>> {
  // Handle promises by recursively calling tryCatch
  if (valueFnOrPromise instanceof Promise) {
    return valueFnOrPromise
      .then((v) => tryCatch(() => v))
      .catch((e) =>
        tryCatch(() => {
          throw e
        }),
      )
  }

  try {
    return { data: valueFnOrPromise(), error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) }
  }
}
