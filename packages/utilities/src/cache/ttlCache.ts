const MAX_TRACKED_KEYS = 1_000

interface CacheEntry {
  value: Promise<unknown>
  expiresAt: number
}

export interface TtlCache {
  get<T>(key: string, compute: () => Promise<T>): Promise<T>
  /** Evict one key so the next call recomputes (e.g. a partially failed result). */
  drop(key: string): void
  /** Shorten one entry's remaining TTL (e.g. retry a degraded result soon without recomputing per request). */
  touch(key: string, remainingMs: number): void
}

/**
 * Per-process TTL cache for async reads. Unlike `createLruCache`, it caches the
 * in-flight promise, so concurrent callers share one computation, and a
 * rejection is dropped instead of cached. Entries are bounded and swept
 * lazily; multi-process deploys recompute per process.
 */
export function createTtlCache({ ttlMs }: { ttlMs: number }): TtlCache {
  const entries = new Map<string, CacheEntry>()

  function sweep(now: number): void {
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= now) {
        entries.delete(key)
      }
    }
    if (entries.size > MAX_TRACKED_KEYS) {
      const overflow = entries.size - MAX_TRACKED_KEYS
      let removed = 0
      for (const key of entries.keys()) {
        if (removed >= overflow) {
          break
        }
        entries.delete(key)
        removed += 1
      }
    }
  }

  return {
    get<T>(key: string, compute: () => Promise<T>): Promise<T> {
      const now = Date.now()
      const existing = entries.get(key)
      if (existing && existing.expiresAt > now) {
        return existing.value as Promise<T>
      }
      sweep(now)
      const value = compute()
      entries.set(key, { value, expiresAt: now + ttlMs })
      // Drop rejections so the next caller retries instead of caching the error.
      value.catch(() => {
        if (entries.get(key)?.value === value) {
          entries.delete(key)
        }
      })
      return value
    },
    drop(key: string): void {
      entries.delete(key)
    },
    touch(key: string, remainingMs: number): void {
      const entry = entries.get(key)
      if (entry) {
        entry.expiresAt = Math.min(entry.expiresAt, Date.now() + remainingMs)
      }
    },
  }
}
