import { Code, ConnectError } from '@connectrpc/connect'

/**
 * Retries for a `Code.Unavailable` ConnectError. Backend services that front reads with the shared
 * SWR cache (`lib-cache`; data-api and liquidity today) answer a cold-key lock loser immediately
 * with Unavailable plus `retry-after-ms` / `expected-ready-ms` metadata instead of waiting on the
 * request that is filling the cache. Retrying costs the backend a lock check, not an upstream call,
 * so it gets a bigger budget than a generic failure. Five retries on the schedule below span roughly
 * 8–16s of skeleton before the error state: that outlasts a merely slow fill (`expected-ready-ms` is
 * ~2s) without holding users for the full 30s lock TTL, which only runs out when the filler died
 * and the error state is the honest answer.
 */
export const MAX_RETRIES_UNAVAILABLE = 5

/**
 * Retries for any other retryable error. `SharedQueryClient`'s default policy only covers FetchError
 * 500s, which a ConnectRPC error never is — without an explicit `retry`, one failed request drops
 * the query into its error state.
 */
export const MAX_RETRIES_DEFAULT = 2

/**
 * Codes that describe the request or the caller, not the server's moment: the same call fails the
 * same way again, so retrying only delays the error state and doubles the load. Follows the gRPC
 * status-code guidance on which codes a client should not retry.
 */
const TERMINAL_CODES: ReadonlySet<Code> = new Set([
  Code.InvalidArgument,
  Code.NotFound,
  Code.AlreadyExists,
  Code.PermissionDenied,
  Code.Unauthenticated,
  Code.FailedPrecondition,
  Code.OutOfRange,
  Code.Unimplemented,
])

const BASE_DELAY_MS = 500
const MAX_DELAY_MS = 8_000
const RETRY_AFTER_METADATA_KEY = 'retry-after-ms'

export function isConnectUnavailableError(error: unknown): error is ConnectError {
  return error instanceof ConnectError && error.code === Code.Unavailable
}

/** True for a ConnectError whose code means a retry of the same request cannot succeed. */
export function isTerminalConnectError(error: unknown): error is ConnectError {
  return error instanceof ConnectError && TERMINAL_CODES.has(error.code)
}

/**
 * The backend's suggested backoff, when the gateway exposes the metadata header to the browser.
 * Undefined when absent or unparseable — the caller falls back to its own schedule.
 */
export function getConnectRetryAfterMs(error: unknown): number | undefined {
  if (!(error instanceof ConnectError)) {
    return undefined
  }
  const raw = error.metadata.get(RETRY_AFTER_METADATA_KEY)
  const parsed = raw === null ? NaN : Number(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

/**
 * react-query `retry` option for queries backed by a ConnectRPC client. `failureCount` is
 * react-query's 0-based retry index — 0 on the first failure — so `failureCount < N` grants N
 * retries, the same as a numeric `retry: N`.
 */
export function shouldRetryConnectQuery(failureCount: number, error: Error): boolean {
  if (isTerminalConnectError(error)) {
    return false
  }
  const maxRetries = isConnectUnavailableError(error) ? MAX_RETRIES_UNAVAILABLE : MAX_RETRIES_DEFAULT
  return failureCount < maxRetries
}

/**
 * react-query `retryDelay` option paired with {@link shouldRetryConnectQuery}: exponential backoff
 * with equal jitter (half the window fixed, half random) so a crowd of clients that all lost the
 * same lock race doesn't retry in lockstep. The server's `retry-after-ms` hint, when present, raises
 * the fixed half (capped at MAX_DELAY_MS) and the random half still applies on top — a hint above
 * the window must not put every lock loser back on the same instant.
 *
 * Windows by failureCount: 250–500ms, 500–1000ms, 1–2s, 2–4s, 4–8s, then capped at 4–8s.
 */
export function getConnectQueryRetryDelay(failureCount: number, error: Error): number {
  const window = Math.min(BASE_DELAY_MS * 2 ** failureCount, MAX_DELAY_MS)
  const floor = Math.max(window / 2, Math.min(getConnectRetryAfterMs(error) ?? 0, MAX_DELAY_MS))
  return floor + Math.random() * (window / 2)
}
