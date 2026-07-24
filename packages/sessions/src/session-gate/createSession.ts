import { SessionReadyTimeoutError } from '@universe/sessions/src/session-gate/errors'
import { singleflight } from '@universe/sessions/src/session-gate/singleflight'
import type { Session, SessionAdapter, SessionGateState } from '@universe/sessions/src/session-gate/types'

const DEFAULT_READY_TIMEOUT_MS = 10_000
const DEFAULT_RECOVER_COOLDOWN_MS = 1_000

/** Dependencies for {@link createSession}. Matches the package's `create*(ctx)` convention. */
export interface CreateSessionContext {
  /** Single-flight fetch-and-cache port (the React Query adapter in production). */
  readonly adapter: SessionAdapter
  /**
   * Monotonic millisecond clock, e.g. `performance.now`. Required so the factory owns no
   * global-clock binding (mirrors `CreatePerformanceTrackerContext.getNow`). Must be monotonic:
   * the recover cooldown measures an elapsed interval, which a wall clock can corrupt by jumping.
   */
  readonly getNow: () => number
  /** Min ms between `recover()`-driven re-establishment attempts. Default 1000. */
  readonly recoverCooldownMs?: number
}

/**
 * Assembles a `Session` capability from a `SessionAdapter`.
 *
 * Re-establishment is bounded so a stuck session can't storm the challenge flow: `ready()`
 * fast-paths settled statuses (never re-establishes on `error`), and `recover()` is both
 * single-flight (concurrent calls share one heal) and cooldown-bounded (sequential calls within
 * `recoverCooldownMs` skip). Together these keep establishment O(1) in request volume.
 */
export function createSession(ctx: CreateSessionContext): Session {
  const { adapter, getNow } = ctx
  const recoverCooldownMs = ctx.recoverCooldownMs ?? DEFAULT_RECOVER_COOLDOWN_MS

  // Recover throttle. Any establishment attempt — `ready()`'s idle establish or `heal()` — opens
  // the window, so an establish on either path throttles the other. Armed at attempt *start*, so a
  // failed heal throttles identically to a successful one (no unbounded retry on persistent failure).
  let lastAttemptAt: number | null = null
  const markAttempt = (): void => {
    lastAttemptAt = getNow()
  }
  const inCooldown = (): boolean => lastAttemptAt !== null && getNow() - lastAttemptAt < recoverCooldownMs

  // Single-flight so a heal slower than the cooldown (a Turnstile solve can outlast it) can't start
  // a second concurrent `refetchSession`; overlapping `recover()` calls join the one in-flight heal.
  const heal = singleflight((): Promise<void> => {
    markAttempt()
    return adapter.refetchSession()
  })

  return {
    ready: ({ timeoutMs = DEFAULT_READY_TIMEOUT_MS } = {}): Promise<void> => {
      // `ready()` runs on every gated request. Settled statuses need no work: `success` is ready,
      // and `error` is terminal for this attempt — re-establishing per request is the storm, so
      // surface instead and let `recover()` (cooldown-bounded) own healing.
      const status = adapter.getStatus()
      if (status === 'success' || status === 'error') return Promise.resolve()
      markAttempt() // arm the cooldown so an immediate 401 shares this establish, not a second one
      let timer: ReturnType<typeof setTimeout> | undefined
      const timeout = new Promise<void>((_, reject) => {
        timer = setTimeout(() => reject(new SessionReadyTimeoutError(timeoutMs)), timeoutMs)
      })
      return Promise.race([adapter.fetchSession(), timeout]).finally(() => clearTimeout(timer))
    },
    recover: (): Promise<void> => (inCooldown() ? Promise.resolve() : heal()),
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
