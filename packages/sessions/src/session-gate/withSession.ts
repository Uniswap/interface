import { isConnectUnauthorized, isFetchUnauthorized } from '@universe/sessions/src/session-gate/classifyError'
import { gated } from '@universe/sessions/src/session-gate/createGate'
import type { Session } from '@universe/sessions/src/session-gate/types'
import type { Logger } from 'utilities/src/logger/logger'

const isSessionUnauthorized = (err: unknown): boolean => isConnectUnauthorized(err) || isFetchUnauthorized(err)

interface WithSessionOptions {
  getSession: () => Session | null
  source: string
  getLogger?: () => Logger
}

/**
 * Generic Promise HOF for session-gating arbitrary calls. Generalizes
 * `createWithSessionRetry`. When `getSession` returns null, passes through.
 */
export function withSession({
  getSession,
  source,
  getLogger,
}: WithSessionOptions): <T>(fn: () => Promise<T>) => Promise<T> {
  return <T>(fn: () => Promise<T>): Promise<T> => {
    const session = getSession()
    if (!session) return fn()
    return gated({ session, call: fn, isUnauthError: isSessionUnauthorized, source, getLogger })
  }
}
