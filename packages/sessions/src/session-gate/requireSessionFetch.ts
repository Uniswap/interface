import { isSessionAuthFailureStatus } from '@universe/sessions/src/session-gate/classifyError'
import { gated } from '@universe/sessions/src/session-gate/createGate'
import type { Session } from '@universe/sessions/src/session-gate/types'
import type { Logger } from 'utilities/src/logger/logger'

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

interface RequireSessionFetchOptions {
  getSession: () => Session | null
  /** Identifier for telemetry, e.g. `unirpc-ethers`, `fetch-trading`. */
  source: string
  getLogger?: () => Logger
}

/**
 * Gates a `fetch`-shaped function. Pass-through when `getSession` returns null.
 * Otherwise delegates to `gated()` with a result-based 401/403 classifier so the
 * same policy + observability applies as the throw-based decorators.
 *
 * For viem's `http` transport (no custom-fetch option), wrap at the Transport
 * level — see `@universe/chains#createSessionGatedTransport`.
 */
export function requireSessionFetch({
  getSession,
  source,
  getLogger,
}: RequireSessionFetchOptions): (inner: FetchLike) => FetchLike {
  return (inner: FetchLike): FetchLike =>
    async (input, init): Promise<Response> => {
      const session = getSession()
      if (!session) return inner(input, init)
      return gated({
        session,
        call: () => inner(input, init),
        isUnauthResult: (res) => isSessionAuthFailureStatus(res.status),
        source,
        getLogger,
      })
    }
}
