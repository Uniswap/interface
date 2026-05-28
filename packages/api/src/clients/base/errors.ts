import { Code, ConnectError } from '@connectrpc/connect'

export class FetchError extends Error {
  response: Response
  // oxlint-disable-next-line typescript/no-explicit-any -- Error data can be any shape from API responses
  data?: any

  // oxlint-disable-next-line typescript/no-explicit-any -- Error data can be any shape from API responses
  constructor({ response, data, cause }: { response: Response; data?: any; cause?: unknown }) {
    super(`Response status: ${response.status}`)
    this.name = 'FetchError'
    this.response = response
    this.data = data
    this.cause = cause
  }
}

export function isRateLimitFetchError(error: unknown): boolean {
  return (
    error instanceof FetchError &&
    !!error.response.status &&
    // This checks for our backend non-standard rate limit error codes.
    error.response.status >= 412 &&
    error.response.status <= 429
  )
}

export function is401Error(error: unknown): boolean {
  if (error instanceof FetchError && error.response.status === 401) {
    return true
  }
  if (error instanceof ConnectError && error.code === Code.Unauthenticated) {
    return true
  }
  return false
}

export function is404Error(error: unknown): boolean {
  return error instanceof FetchError && !!error.response.status && error.response.status === 404
}
