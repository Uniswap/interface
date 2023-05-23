import { InMemoryCache } from '@apollo/client'
import { MMKVWrapper, persistCache } from 'apollo3-cache-persist'
import { setupCache } from 'wallet/src/data/cache'
import { logger } from 'wallet/src/features/logger/logger'

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
  } catch (e) {
    logger.error('data/cache', 'setupCache', `Non-fatal error while restoring Apollo cache: ${e}`)
  }

  return cache
}
