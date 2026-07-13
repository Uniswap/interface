import type { Interceptor } from '@connectrpc/connect'
import { SessionService } from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_connect'
import { isConnectUnauthorized } from '@universe/sessions/src/session-gate/classifyError'
import { gated } from '@universe/sessions/src/session-gate/createGate'
import type { Session } from '@universe/sessions/src/session-gate/types'
import type { Logger } from 'utilities/src/logger/logger'

/**
 * Pinned to the SessionService's generated `typeName`. Importing from the
 * generated client (rather than hardcoding the string) keeps the loop-breaker
 * tied to the canonical service name — a proto rename or version bump will
 * surface as a type error rather than a silent deadlock on the first 401.
 */
const SESSION_SERVICE_TYPE_NAME = SessionService.typeName

interface RequireSessionInterceptorOptions {
  getSession: () => Session | null
  source: string
  getLogger?: () => Logger
}

/**
 * Gates Connect-RPC calls against the session. Always skips the SessionService
 * itself (avoids recover() → initSession() → recover() deadlock). When
 * `getSession` returns null, passes through.
 */
export function requireSessionInterceptor({
  getSession,
  source,
  getLogger,
}: RequireSessionInterceptorOptions): Interceptor {
  return (next) => async (request) => {
    if (request.service.typeName === SESSION_SERVICE_TYPE_NAME) {
      return next(request)
    }
    const session = getSession()
    if (!session) return next(request)
    return gated({
      session,
      call: () => next(request),
      isUnauthError: isConnectUnauthorized,
      source,
      getLogger,
    })
  }
}

/** Exported for tests — confirms the loop-breaker is tied to the proto name. */
export const SESSION_SERVICE_LOOP_BREAKER_TYPE_NAME = SESSION_SERVICE_TYPE_NAME
