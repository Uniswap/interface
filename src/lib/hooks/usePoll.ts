import ms from 'ms.macro'
import { useEffect, useMemo, useState } from 'react'

const DEFAULT_POLLING_INTERVAL = ms`15s`
const DEFAULT_KEEP_UNUSED_DATA_FOR = ms`10s`

export default function usePoll<A, T>(
  fetch: () => Promise<T>,
  key = '',
  pollingInterval = DEFAULT_POLLING_INTERVAL,
  keepUnusedDataFor = DEFAULT_KEEP_UNUSED_DATA_FOR
): T | undefined {
  const cache = useMemo(() => new Map<string, { ttl: number; result?: T }>(), [])
  const [data, setData] = useState<{ key: string; result?: T }>({ key })

  useEffect(() => {
    let timeout: number

    const entry = cache.get(key)
    if (entry && entry.ttl + keepUnusedDataFor > Date.now()) {
      timeout = setTimeout(poll, Math.max(0, entry.ttl - Date.now()))
      setData({ key, result: entry.result })
    } else {
      setData({ key })
      cache.set(key, { ttl: Date.now() + pollingInterval })
      poll()
    }

    return () => {
      clearTimeout(timeout)
    }

    async function poll(ttl = Date.now() + pollingInterval) {
      timeout = setTimeout(poll, pollingInterval)
      const result = await fetch()
      cache.set(key, { ttl, result })
      setData((data) => {
        return data.key === key ? { key, result } : data
      })
    }
  }, [cache, fetch, keepUnusedDataFor, key, pollingInterval])

  return data.result
}
