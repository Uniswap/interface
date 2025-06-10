import { logger } from 'utilities/src/logger/logger'

/**
 * Stub implementation for non-Android platforms that logs an error when called.
 * The actual implementation for Android is in startAndroidInAppUpdate.android.ts
 *
 * @param isRequired - Whether the update is required or recommended
 * @returns false - Always returns false on non-Android platforms
 */
export async function startAndroidInAppUpdate({ isRequired: _isRequired }: { isRequired: boolean }): Promise<boolean> {
  logger.error(new Error('Unexpected call to `startAndroidInAppUpdate` in unsupported platform'), {
    tags: {
      file: 'startAndroidInAppUpdate.ts',
      function: 'startAndroidInAppUpdate',
    },
  })

  return false
}
