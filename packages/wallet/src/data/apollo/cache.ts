import { InMemoryCache } from '@apollo/client'
import { persistCache } from 'apollo3-cache-persist'
import { PersistentStorage } from 'apollo3-cache-persist/lib/types'
import { setupSharedApolloCache } from 'uniswap/src/data/cache'
import { logger } from 'utilities/src/logger/logger'

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

  return cache
}
