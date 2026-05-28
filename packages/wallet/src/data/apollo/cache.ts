import { gql, InMemoryCache } from '@apollo/client'
import { persistCache } from 'apollo3-cache-persist'
import { PersistentStorage } from 'apollo3-cache-persist/lib/types'
import { setupSharedApolloCache } from 'uniswap/src/data/cache'
import { logger } from 'utilities/src/logger/logger'

// Increment this when you want to wipe out the cache for all users next time they open the app.
const CACHE_VERSION = '1'

const CACHE_VERSION_QUERY_KEY = 'apolloCacheVersion'

const CACHE_VERSION_QUERY = gql`
  query GetCacheVersion {
    ${CACHE_VERSION_QUERY_KEY} @client
  }
`

/**
 * Checks if the cache needs to be reset based on version mismatch
 * @internal
 */
export function shouldResetCache(cache: InMemoryCache): boolean {
  try {
    const result = cache.readQuery({
      query: CACHE_VERSION_QUERY,
    }) as { [CACHE_VERSION_QUERY_KEY]?: string } | undefined

    const storedVersion = result?.[CACHE_VERSION_QUERY_KEY]
    const needsReset = storedVersion !== CACHE_VERSION

    if (needsReset) {
      logger.debug('cache.ts', 'shouldResetCache', 'Persisted apollo cache version mismatch detected', {
        storedVersion,
        currentVersion: CACHE_VERSION,
      })
    }

    return needsReset
  } catch (error) {
    // This happens when the cache is empty
    logger.debug('cache.ts', 'shouldResetCache', 'Failed to read persisted apollo cache version', {
      currentVersion: CACHE_VERSION,
      error,
    })
    return true
  }
}

/**
 * Stores the current cache version in the cache
 * @internal
 */
export function storeCacheVersion(cache: InMemoryCache): void {
  try {
    cache.writeQuery({
      query: CACHE_VERSION_QUERY,
      data: {
        [CACHE_VERSION_QUERY_KEY]: CACHE_VERSION,
      },
    })
  } catch (error) {
    logger.error(error, {
      tags: { file: 'cache.ts', function: 'storeCacheVersion' },
      extra: { version: CACHE_VERSION },
    })
  }
}

/**
 * Initializes and persists/rehydrates cache
 */
export async function initAndPersistCache({
  storage,
  maxCacheSizeInBytes,
}: {
  storage: PersistentStorage<string>
  maxCacheSizeInBytes: number
}): Promise<InMemoryCache> {
  const cache = setupSharedApolloCache()

  try {
    await persistCache({
      cache,
      storage,
      maxSize: maxCacheSizeInBytes,
    })
  } catch (error) {
    logger.error(error, { tags: { file: 'cache', function: 'initAndPersistCache' } })
  }

  // Check if cache version matches current version
  const needsReset = shouldResetCache(cache)

  if (needsReset) {
    logger.debug('cache.ts', 'initAndPersistCache', 'Resetting persisted apollo cache due to version mismatch', {
      version: CACHE_VERSION,
    })
    await cache.reset()
  } else {
    logger.debug('cache.ts', 'initAndPersistCache', 'Persisted apollo cache version matches current version', {
      version: CACHE_VERSION,
    })
  }

  // Always store the current version after reset or validation
  storeCacheVersion(cache)

  return cache
}
