import { Image as ExpoImage } from 'expo-image'
import { AppState } from 'react-native'
import { logger } from 'utilities/src/logger/logger'

// TODO(apps-infra): when expo-image is upgraded to Expo SDK 55 or later, call `ExpoImage.configureCache({
// maxMemoryCost, maxMemoryCount })` here to bound the in-memory bitmap LRU. The current
// installed version does not expose that static method.

/**
 * Wires app-level memory pressure handling for expo-image.
 */
export function setupExpoImageMemoryWatcher() {
  // Drop decoded bitmaps from memory when the OS signals memory pressure.
  AppState.addEventListener('memoryWarning', () => {
    logger.warn(
      'expoImageCacheSetup.ts',
      'setupExpoImageMemory',
      'Clearing expo-image memory cache due to memory pressure',
    )
    ExpoImage.clearMemoryCache().catch((error) => {
      logger.error(new Error('Error clearing expo-image memory cache', { cause: error }), {
        tags: {
          file: 'expoImageCacheSetup.ts',
          function: 'setupExpoImageMemory',
        },
      })
    })
  })
}
