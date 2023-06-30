import { InMemoryCache } from '@apollo/client'
import { MMKVWrapper, persistCache } from 'apollo3-cache-persist'
import { setupCache } from 'wallet/src/data/cache'
import { logger } from 'wallet/src/features/logger/logger'
import serializeError from 'wallet/src/utils/serializeError'

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
    })
  } catch (error) {
    logger.error('Unable to persist cache', {
      tags: {
        file: 'cache',
        function: 'initAndPersistCache',
        error: serializeError(error),
      },
    })
  }

  return cache
}
