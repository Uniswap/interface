/**
 * Sliding-window in-memory rate limiter.
 *
 * Per-process state — on N tasks the effective limit is N × max. That is fine
 * for what it guards: a log-ingest endpoint whose worst case is a crash-looping
 * browser shouting into stdout, or per-user spend guards, not a credential
 * attack. Swap `RateLimiter` for a shared store if that changes.
 *
 * Memory is hard-capped: at most `MAX_TRACKED_KEYS` keys, each holding at most
 * `2 × max` timestamps, however many distinct keys arrive inside one window.
 */

export interface RateLimiter {
  isLimited(key: string): boolean
  record(key: string): void
}

const MAX_TRACKED_KEYS = 10_000

export function createSlidingWindowLimiter(max: number, windowMs: number): RateLimiter {
  const timestamps = new Map<string, number[]>()

  return {
    isLimited(key) {
      const now = Date.now()
      const entries = timestamps.get(key)
      if (!entries) {
        return false
      }
      const recent = entries.filter((ts) => now - ts < windowMs)
      // Re-insert to mark the key recently used: a limited caller only ever
      // reaches this check (its requests are refused before `record`), and it
      // must not age out of the map while it is still hammering.
      timestamps.delete(key)
      if (recent.length > 0) {
        timestamps.set(key, recent)
      }
      return recent.length >= max
    },
    record(key) {
      const entries = timestamps.get(key) ?? []
      // Bound the per-key history too: `isLimited` trims it on every read, but
      // a caller that never trips the check must not grow an unbounded array.
      if (entries.length < max * 2) {
        entries.push(Date.now())
      }
      timestamps.delete(key)
      timestamps.set(key, entries)

      // Evict the least-recently-used key instead of sweeping the whole map.
      //
      // The sweep this replaces re-filtered every entry on EVERY record() past
      // the cap, and inside a live window it could evict nothing — so the map
      // grew without bound while each request did O(n) work. A distinct-key
      // flood turned the limiter into the amplifier.
      //
      // JS Maps iterate in insertion order and both methods re-insert the key
      // they touch, so `keys().next()` is the least recently used. Dropping it
      // is O(1) and costs that key its history (a fresh window); memory is
      // hard-capped.
      if (timestamps.size > MAX_TRACKED_KEYS) {
        const oldest = timestamps.keys().next().value
        if (oldest !== undefined) {
          timestamps.delete(oldest)
        }
      }
    },
  }
}
