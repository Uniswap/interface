import { InMemoryCache } from '@apollo/client'
import { MMKVWrapper, persistCache } from 'apollo3-cache-persist'
import { logger } from 'utilities/src/logger/logger'
import { setupCache } from 'wallet/src/data/cache'

const MAX_CACHE_SIZE_IN_BYTES = 1024 * 1024 * 25 // 25 MB

/**
 * Initializes and persists/rehydrates cache
 * @param storage MMKV wrapper to use as storage
 * @returns
 */
export async function initAndPersistCache(storage: MMKVWrapper): Promise<InMemoryCache> {
  const cache = setupCache()

  try {
    await persistCache({
      cache,
      storage,
      maxSize: MAX_CACHE_SIZE_IN_BYTES,
    })
  } catch (error) {
    logger.error(error, { tags: { file: 'cache', function: 'initAndPersistCache' } })
  }

  return cache
}
