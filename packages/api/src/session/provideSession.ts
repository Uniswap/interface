import { SharedQueryClient } from '@universe/api/src/clients/base/SharedQueryClient'
import type { Session, SessionInitializationService } from '@universe/sessions'
import { createSession, SessionNotBootstrappedError, sessionInitQuery } from '@universe/sessions'
import type { Logger } from 'utilities/src/logger/logger'

let cachedSession: Session | null = null

/**
 * Bootstraps the shared `Session` capability with the platform-specific
 * `SessionInitializationService` provider. Idempotent. Called by `ApiInit`
 * on first mount so `provideSession()` resolves anywhere thereafter.
 *
 * The module-level `cachedSession` is the one unavoidable piece of module
 * state — a process-wide singleton has to live somewhere. All other state
 * (single-flight on `recover()`, etc.) is closure-scoped inside `createSession`.
 */
export function bootstrapSession(ctx: {
  getService: () => SessionInitializationService
  getLogger?: () => Logger
}): Session {
  if (cachedSession) return cachedSession

  const options = sessionInitQuery({ getService: ctx.getService, getLogger: ctx.getLogger })
  const queryKey = options.queryKey
  // Compute the query hash via the QueryClient's configured hashFn rather than
  // a side-channel call to a stand-alone hashKey — keeps the comparison
  // consistent with whatever hashing strategy the QueryClient uses internally,
  // even if SharedQueryClient's config ever changes.
  const targetHash = SharedQueryClient.defaultQueryOptions({ queryKey }).queryHash

  cachedSession = createSession({
    adapter: {
      fetchSession: async () => {
        await SharedQueryClient.fetchQuery(options)
      },
      refetchSession: async () => {
        await SharedQueryClient.refetchQueries({ queryKey })
      },
      getStatus: () => SharedQueryClient.getQueryState(queryKey)?.status ?? 'idle',
      hasData: () => SharedQueryClient.getQueryState(queryKey)?.data != null,
      subscribe: (listener) =>
        SharedQueryClient.getQueryCache().subscribe((event) => {
          if (event.query.queryHash === targetHash) listener()
        }),
    },
    // Monotonic clock for the recover cooldown's interval math — never a wall clock.
    getNow: () => performance.now(),
  })

  return cachedSession
}

/**
 * Throws `SessionNotBootstrappedError` if called before `bootstrapSession`.
 * Surfaces wiring mistakes immediately rather than as silent failures.
 * Use `tryProvideSession()` for the safe variant that returns null instead.
 */
export function provideSession(): Session {
  if (!cachedSession) {
    throw new SessionNotBootstrappedError()
  }
  return cachedSession
}

/**
 * Returns the shared Session if `bootstrapSession()` has been called,
 * otherwise null. The transport-level gates short-circuit on null, so this
 * doubles as the "is the gate active" signal.
 *
 * Distinguishes "not bootstrapped" (return null) from other errors thrown
 * by `provideSession()` (rethrow) so genuine singleton failures don't
 * silently disable the gate forever.
 */
export function tryProvideSession(): Session | null {
  try {
    return provideSession()
  } catch (err) {
    if (err instanceof SessionNotBootstrappedError) return null
    throw err
  }
}

/**
 * Test-only: clears the cached singleton so tests can bootstrap a fresh
 * session per case. Not exposed in production code paths.
 */
export function __resetSessionForTests(): void {
  cachedSession = null
}
