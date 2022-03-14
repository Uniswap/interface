import useBlockNumber from 'lib/hooks/useBlockNumber'
import { useCallback, useEffect, useState } from 'react'

export const ShouldUpdateCache = Symbol()

/**
 * Configures leader/followers for a block-scoped cache (ie a cache that clears every block).
 * This is useful for data-fetching hooks which are called throughout the component tree with the
 * same data, allowing the data to be shared across the tree without being re-fetched. This is
 * important because useMemo only works within a component, so a cache is necessary for
 * performance.
 *
 * Returns [value, setValue]. value may be either the cached value or ShouldUpdateCache.
 * iff value === ShouldUpdateCache, the caller is the leader, and should fetch data and update via
 * setValue. If value !== ShouldUpdateCache, the caller should _not_ fetch data, and return value.
 *
 *     const cache = new Map<string, object>()
 *
 *     function useFetchData() {
 *       const key = useGetDataKey()
 *       const [value, setValue] = useBlockCache(cache, key)
 *
 *       // The leader fetches data. Followers should short-circuit (usually passing undefined).
 *       const data = useFetchData(value === ShouldUpdateCache ? key : undefined)
 *
 *       if (value === ShouldUpdateCache) {
 *         setValue(data)
 *         return data
 *       }
 *       return value
 *     }
 */
export default function useBlockCache<K, V>(
  cache: Map<K, V | null>,
  key?: K
): [V | null | typeof ShouldUpdateCache, (update: V) => void] {
  // This hooks should only take "lead" (ie not use the cache) if the cache has not yet been set.
  // This avoids having multiple hooks taking "lead".
  const [lead, setLead] = useState(key ? !cache.has(key) : false)
  if (key && !cache.has(key)) {
    cache.set(key, null)
    setLead(true)
  }

  // Clears the cache every block.
  const block = useBlockNumber()
  useEffect(() => {
    cache.clear()
    // Immediately set the cache to keep the "lead".
    if (lead && key) {
      cache.set(key, null)
    }
  }, [block, cache, key, lead])

  useEffect(() => {
    return () => {
      // If there is not yet a cached value when unmounting, give up the "lead".
      if (lead && key && !cache.get(key)) {
        cache.delete(key)
      }
    }
  })

  // Grab the value outside of a hook to force followers to re-render when it is updated.
  const value = (key && cache.get(key)) ?? null

  const setValue = useCallback(
    (update: V) => {
      if (key) {
        if (lead && value !== update) {
          cache.set(key, update)
        }
      }
    },
    [cache, key, lead, value]
  )
  return [lead ? ShouldUpdateCache : value, setValue]
}
