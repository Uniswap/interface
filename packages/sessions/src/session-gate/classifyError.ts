import { Code, ConnectError } from '@connectrpc/connect'

/**
 * HTTP statuses the entry-gateway returns when a request needs a (re)established
 * or upgraded session — each is worth one `recover()` + retry through the gate:
 *   401 unauthenticated → a session exists but its auth_score is too low
 *   403 forbidden       → no valid session yet (e.g. the cold-start race, before
 *                         the session cookie is attached)
 * Both are recoverable: `recover()` re-initializes the session and the retry
 * carries the freshly-established/upgraded session. The gate retries once, so a
 * genuinely-terminal 403 (e.g. a hard WAF/geo block) costs at most one extra call.
 */
export function isSessionAuthFailureStatus(status: number | undefined): boolean {
  return status === 401 || status === 403
}

export function isConnectUnauthorized(err: unknown): boolean {
  // Over Connect-RPC the gateway's 401 surfaces as Unauthenticated and its 403
  // as PermissionDenied — both map to "needs a (re)established session".
  return err instanceof ConnectError && (err.code === Code.Unauthenticated || err.code === Code.PermissionDenied)
}

/**
 * Prefers a typed `status` (viem's `HttpRequestError`, fetch wrappers that
 * surface status). Falls back to a word-boundary `401`/`403` match on the
 * message for transports that only encode status in the error string.
 */
export function isFetchUnauthorized(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const status = (err as Error & { status?: unknown }).status
  if (typeof status === 'number') return isSessionAuthFailureStatus(status)
  return /\b(401|403)\b/.test(err.message)
}
