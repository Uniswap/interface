/**
 * Session capability state, derived from the adapter's raw status + data presence.
 * - `recovering`: pending + has data (refetch in flight, stale data present)
 * - `initializing`: pending + no data (first-time fetch)
 */
export type SessionGateState = 'idle' | 'initializing' | 'ready' | 'recovering' | 'failed'

/**
 * The session capability consumers hold to gate session-dependent requests.
 *
 * Three verbs: `ready()` waits, `recover()` re-validates after a 401,
 * `getState()` / `subscribe` expose state for React reflection.
 */
export interface Session {
  ready(opts?: { timeoutMs?: number }): Promise<void>
  recover(): Promise<void>
  getState(): SessionGateState
  subscribe(listener: () => void): () => void
}

/**
 * The port between `Session` and any single-flight fetch-and-cache primitive.
 *
 * React Query implements this directly: `fetchSession` → `fetchQuery`,
 * `refetchSession` → `refetchQueries`, `getStatus` → `getQueryState().status`,
 * `hasData` → `getQueryState().data != null`, `subscribe` → `getQueryCache().subscribe`.
 *
 * Implementations MUST be single-flight on both fetch methods. This isn't
 * enforced by the type system: the React Query adapter gets it for free
 * (`fetchQuery`/`refetchQueries` dedupe concurrent calls on the query key),
 * and `createSession` additionally single-flights `recover()`'s refetch via `singleflight()`.
 */
export interface SessionAdapter {
  fetchSession: () => Promise<void>
  refetchSession: () => Promise<void>
  getStatus: () => 'idle' | 'pending' | 'success' | 'error'
  hasData: () => boolean
  subscribe: (listener: () => void) => () => void
}
