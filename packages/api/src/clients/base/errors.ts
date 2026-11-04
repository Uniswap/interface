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

const BLOCKED_ACCOUNT_DETAIL = /account is blocked/i

/**
 * A REST refusal for a blocked wallet, in either shape the backend sends: trading's 401 `UnauthorizedError` with
 * detail "Account is blocked", or a 403 (the entry-gateway compliance gate's `COMPLIANCE_BLOCKED`, or trading's
 * `ForbiddenError`) with the same detail or `compliance.walletBlocked`. The gate fails open to trading, so both
 * coexist. A token-only `COMPLIANCE_BLOCKED` ("Token is blocked") is not an account block.
 */
export function isBlockedAccountFetchError(error: unknown): boolean {
  if (!(error instanceof FetchError)) {
    return false
  }
  if (error.response.status !== 401 && error.response.status !== 403) {
    return false
  }
  const data: unknown = error.data
  if (!data || typeof data !== 'object') {
    return false
  }
  if ('detail' in data && typeof data.detail === 'string' && BLOCKED_ACCOUNT_DETAIL.test(data.detail)) {
    return true
  }
  return (
    'compliance' in data &&
    !!data.compliance &&
    typeof data.compliance === 'object' &&
    'walletBlocked' in data.compliance &&
    data.compliance.walletBlocked === true
  )
}

/** A 403 is a geo/compliance or permissioned-pool block: retrying the same request gets the same answer. */
export function is403Error(error: unknown): boolean {
  return error instanceof FetchError && error.response.status === 403
}

export function is404Error(error: unknown): boolean {
  return error instanceof FetchError && !!error.response.status && error.response.status === 404
}
