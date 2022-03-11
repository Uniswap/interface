import useBlockNumber from 'lib/hooks/useBlockNumber'
import { useCallback, useEffect, useState } from 'react'

/**
 * Configures leader/followers for a block-scoped cache (ie the cache clears every block).
 * This is useful for data-fetching hooks which are called throughout the component tree with the
 * same data, allowing the data to be shared across the tree without being re-fetched (because
 * useMemo only works within a component).
 *
 * Returns [isCacheLeader, updateCache], where
 * - isLeader is true if this hook should actually fetch data, and false if it should not.
 * - updateCache should be called with any retrieved data, and will return the latest data.
 *   Thus, updateCache should be called by both the leader and followers.
 *
 *     const cache = new Map<string, object>()
 *
 *     function useFetchData() {
 *       const key = useGetDataKey()
 *       const [isCacheLeader, updateCache] = useBlockCache(cache, key)
 *
 *       // Followers should prevent data from being fetched.
 *       const data = useFetchData(isCacheLeader ? key : undefined)
 *
 *       // updateCache both updates the cache (for the leader) and returns the most recent data
 *       // (for both the leader and followers).
 *       return updateCache(data)
 *     }
 */
export default function useBlockCache<K, V>(
  cache: Map<K, V | undefined>,
  key?: K
): [boolean, (update?: V) => V | undefined] {
  // This hooks should only take "lead" (ie not use the cache) if the cache has not yet been set.
  // This avoids having multiple hooks taking "lead".
  const [lead, setLead] = useState(key ? !cache.has(key) : false)
  if (key && !cache.has(key)) {
    cache.set(key, undefined)
    setLead(true)
  }

  // Clears the cache every block.
  const block = useBlockNumber()
  useEffect(() => {
    cache.clear()
    // Immediately set the cache to keep the "lead".
    if (lead && key) {
      cache.set(key, undefined)
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
  const value = key && cache.get(key)

  const updateCache = useCallback(
    (update?: V) => {
      if (key) {
        if (lead && value !== update) {
          cache.set(key, update)
          return update
        }
        return value
      }
      return
    },
    [cache, key, lead, value]
  )
  return [lead, updateCache]
}
