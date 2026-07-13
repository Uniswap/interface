/**
 * Wraps an async function so concurrent calls share a single in-flight Promise.
 *
 * State is closure-scoped — each `singleflight` call returns a fresh wrapped
 * function with its own inflight slot. No module state. The slot clears via
 * `.finally` after settlement, so subsequent calls trigger a new invocation.
 *
 * Used in the gate to ensure `recover()` never triggers multiple concurrent
 * `refetchQueries` calls (RQ's refetch defaults to `cancelRefetch: true`,
 * which restarts the in-flight fetch rather than coalescing).
 */
export function singleflight<T>(fn: () => Promise<T>): () => Promise<T> {
  let inflight: Promise<T> | null = null
  return () => {
    if (inflight) return inflight
    inflight = fn().finally(() => {
      inflight = null
    })
    return inflight
  }
}
