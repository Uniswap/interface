import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import { useCallback, useEffect, useState } from 'react'

export const ShouldUpdate = Symbol()

// Denotes a cache entry that is pending data, so that other nodes do not re-fetch the same data.
const Pending = Symbol()

// The current block being cached by subscribers to useBlockCache, for a specific cache.
const blockCache =
  typeof WeakMap !== 'undefined'
    ? new WeakMap<
        Map<string, unknown>,
        {
          block: number
          timestamp: number
        }
      >()
    : null

// The TTL between blocks, in seconds.
// This is necessary for L2, where the cache would otherwise clear too frequently to be usable.
const BLOCK_CACHE_TTL = 30

/**
 * Configures leader/followers for a block-scoped cache (ie a cache that clears every block).
 *
 * This is useful for data-fetching hooks which are called multiple times or are called throughout
 * the component tree with the same key. It enforces that data is fetched only once, and can be
 * shared across the component tree without being re-fetched. This can be seen as a lightweight,
 * web3-specific alternative to eg rtk-query, or an analog to useMemo (as it memoizes across the
 * component tree, whereas useMemo works within a single component).
 *
 * Returns [cachedValue, setCachedValue]. If (cachedValue === ShouldUpdate), the caller should fetch
 * data, update the cache using setCachedValue, and return the fetched data. Otherwise, the caller
 * should _not_ fetch data, and just return the cachedValue.
 *
 * NB: setCachedValue may only be called once per block, so do not set intermediate values.
 *
 *     const cache = new Map<string, object>()
 *
 *     function useFetchData() {
 *       const key = useGetDataKey()
 *       const [cachedValue, setCachedValue] = useBlockCache(cache, key)
 *
 *       // Only fetch data if (cachedValue === ShouldUpdate).
 *       const data = useFetchData(cachedValue === ShouldUpdate ? key : undefined)
 *       return useMemo(() => {
 *         if (cachedValue === ShouldUpdate) {
 *           setCachedValue(data)
 *           return data
 *         }
 *         return cachedValue
 *       })
 *     }
 */
export default function useBlockCache<V>(
  cache?: Map<string, V | typeof Pending>,
  key?: string
): [V | undefined | typeof ShouldUpdate, (update: V) => void] {
  const block = useBlockNumber() ?? 0
  const timestamp = useCurrentBlockTimestamp()?.toNumber() ?? 0
  const [cachingBlock, setCachingBlock] = useState<number | false>(false)

  useEffect(() => {
    const { block: cacheBlock = 0, timestamp: cacheTimestamp = 0 } = (cache && blockCache?.get(cache)) ?? {}

    // Clears the cache if there is a new block at least 15s fresher for this cache
    // (uses Math.abs to compute the difference in case we are on a different chain).
    if (cache && block !== cacheBlock && Math.abs(timestamp - cacheTimestamp) > BLOCK_CACHE_TTL) {
      blockCache?.set(cache, { block, timestamp })
      cache?.clear()
      return
    }

    // Claims a key to update. cache.has(key) tracks whether this key is already owned for this block.
    if (cacheBlock && key && cache && !cache.has(key)) {
      cache?.set(key, Pending)
      setCachingBlock(cacheBlock)
    }

    // Unclaims a key (when switching keys or unmounting) if it has not yet been written this block.
    return () => {
      if (cachingBlock === cacheBlock && key && cache?.get(key) === Pending) {
        cache?.delete(key)
        setCachingBlock(false)
      }
    }
  }, [block, cache, key, cachingBlock, timestamp])

  const cacheValue = key ? cache?.get(key) : undefined
  const isPending = cacheValue === Pending
  const value = isPending ? undefined : cacheValue

  // Only return ShouldUpdate if a this hook has claimed the key this block, and it is still pending.
  // NB: If WeakMap is not supported, this becomes a nop by setting shouldUpdate = true.
  const { block: cacheBlock = 0 } = (cache && blockCache?.get(cache)) ?? {}
  const shouldUpdate = !blockCache || (cachingBlock === cacheBlock && isPending)

  const setValue = useCallback(
    (update: V) => {
      if (!shouldUpdate) {
        throw new Error('The block cache value may only be set if ShouldUpdate is returned')
      }
      if (key) {
        cache?.set(key, update)
      }
    },
    [cache, key, shouldUpdate]
  )

  return [shouldUpdate ? ShouldUpdate : value, setValue]
}
