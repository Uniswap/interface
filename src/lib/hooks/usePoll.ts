import ms from 'ms.macro'
import { useEffect, useMemo, useState } from 'react'

const DEFAULT_POLLING_INTERVAL = ms`15s`
const DEFAULT_KEEP_UNUSED_DATA_FOR = ms`10s`

interface PollingOptions<T> {
  // If true, any cached result will be returned, but no new fetch will be initiated.
  debounce?: boolean

  // If stale, any cached result will be returned, and a new fetch will be initiated.
  staleCallback?: (value: T) => boolean

  pollingInterval?: number
  keepUnusedDataFor?: number
}

interface CacheEntry<T> {
  ttl: number | null // null denotes a pending fetch
  result?: T
}

export default function usePoll<T>(
  fetch: () => Promise<T>,
  key = '',
  {
    debounce = false,
    staleCallback,
    pollingInterval = DEFAULT_POLLING_INTERVAL,
    keepUnusedDataFor = DEFAULT_KEEP_UNUSED_DATA_FOR,
  }: PollingOptions<T>
): T | undefined {
  const cache = useMemo(() => new Map<string, CacheEntry<T>>(), [])
  const [, setData] = useState<{ key: string; result?: T }>({ key })

  useEffect(() => {
    if (debounce) return

    let timeout: number

    const entry = cache.get(key)
    const isStale = staleCallback && entry?.result !== undefined ? staleCallback(entry.result) : false
    if (entry) {
      // If there is not a pending fetch (and there should be), queue one.
      if (entry.ttl) {
        if (isStale) {
          poll() // stale results should be refetched immediately
        } else if (entry.ttl && entry.ttl + keepUnusedDataFor > Date.now()) {
          timeout = setTimeout(poll, Math.max(0, entry.ttl - Date.now()))
        }
      }
    } else {
      // If there is no cached entry, trigger a poll immediately.
      poll()
    }
    setData({ key, result: entry?.result })

    return () => {
      clearTimeout(timeout)
    }

    async function poll(ttl = Date.now() + pollingInterval) {
      timeout = setTimeout(poll, pollingInterval) // queue the next poll
      cache.set(key, { ttl: null, ...cache.get(key) }) // mark the entry as a pending fetch

      // Always set the result in the cache, but only set it as data if the key is still being queried.
      const result = await fetch()
      cache.set(key, { ttl, result })
      setData((data) => (data.key === key ? { key, result } : data))
    }
  }, [cache, debounce, fetch, keepUnusedDataFor, key, pollingInterval, staleCallback])

  useEffect(() => {
    // Cleanup stale entries when a new key is used.
    void key

    const now = Date.now()
    cache.forEach(({ ttl }, key) => {
      if (ttl && ttl + keepUnusedDataFor <= now) {
        cache.delete(key)
      }
    })
  }, [cache, keepUnusedDataFor, key])

  // Use data.result to force a re-render, but actually retrieve the data from the cache.
  // This gives the _first_ render access to a new result, avoiding lag introduced by React.
  return cache.get(key)?.result
}
