import { SessionReadyTimeoutError } from '@universe/sessions/src/session-gate/errors'
import { singleflight } from '@universe/sessions/src/session-gate/singleflight'
import type { Session, SessionAdapter, SessionGateState } from '@universe/sessions/src/session-gate/types'

const DEFAULT_READY_TIMEOUT_MS = 10_000

/**
 * Assembles a `Session` capability from a `SessionAdapter`.
 *
 * Single-flight on `recover()` lives here (closure-scoped via `singleflight`),
 * not in the adapter, so the gate's contract — "concurrent recover() calls
 * share one flow" — holds regardless of whether the underlying cache
 * primitive (e.g. RQ's `refetchQueries`) is single-flight on its own.
 */
export function createSession(adapter: SessionAdapter): Session {
  const recoverOnce = singleflight(() => adapter.refetchSession())

  return {
    ready: ({ timeoutMs = DEFAULT_READY_TIMEOUT_MS } = {}): Promise<void> => {
      // Fast path: an already-successful session needs no fetch or timer. `ready()`
      // runs on every gated request, so skip the timeout + Promise.race churn.
      if (adapter.getStatus() === 'success') return Promise.resolve()
      let timer: ReturnType<typeof setTimeout> | undefined
      const timeout = new Promise<void>((_, reject) => {
        timer = setTimeout(() => reject(new SessionReadyTimeoutError(timeoutMs)), timeoutMs)
      })
      return Promise.race([adapter.fetchSession(), timeout]).finally(() => clearTimeout(timer))
    },
    recover: recoverOnce,
    getState: () => mapState(adapter.getStatus(), adapter.hasData()),
    subscribe: adapter.subscribe,
  }
}

function mapState(status: ReturnType<SessionAdapter['getStatus']>, hasData: boolean): SessionGateState {
  if (status === 'success') return 'ready'
  if (status === 'error') return 'failed'
  if (status === 'idle') return 'idle'
  return hasData ? 'recovering' : 'initializing'
}
