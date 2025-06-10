import SpInAppUpdates, { IAUUpdateKind, StartUpdateOptions } from 'sp-react-native-in-app-updates'
import { logger } from 'utilities/src/logger/logger'
import { isAndroid } from 'utilities/src/platform'

/**
 * Checks for available updates and starts the update flow if one is available.
 *
 * HOW TO TEST ANDROID IN-APP UPDATES:
 * It can be tricky to test this, but you can follow these steps:
 * 1. Create a new branch, make changes and push it to remote.
 * 2. Trigger a Dev build from your branch in order to upload a new version to the Play Store.
 * 3. Install the Dev build (make sure you've opted in to "internal testing") from the Play Store.
 * 4. Trigger a second Dev build in order to upload *another* version of the app to the Play Store.
 *    We need a newer version to be available when checking for updates, so do not install this version.
 * 5. Open the app and enable the dynamic config "Force Upgrade Status" to "Soft Upgrade".
 * 6. You will now see the soft upgrade modal. Click "Update Now" and you should see the in-app update flow.
 *    If you see a redirect to the Play Store instead, then the in-app update flow is not working
 *    or there is no update available (the redirect is a fallback).
 *
 * @param isRequired - Whether the update is required or recommended
 * @returns Promise<boolean> - true if update started, false otherwise
 */
export async function startAndroidInAppUpdate({ isRequired }: { isRequired: boolean }): Promise<boolean> {
  // Only supported on Android
  if (!isAndroid) {
    return false
  }

  const inAppUpdates = new SpInAppUpdates(false) // false = not in debug mode

  try {
    // Check if update is available (auto-detects current version)
    const result = await inAppUpdates.checkNeedsUpdate()

    if (!result.shouldUpdate) {
      // This should only happen if we misconfigure statsig or if the user is using a very old Android version that we no longer support.
      // When this happens, the `ForceUpgradeModal` component will redirect to the Play Store where the user would be able to see that
      // there are either no updates available or their device is no longer supported.
      logger.error(new Error('Unexpected call to `startAndroidInAppUpdate` when no update is available'), {
        tags: {
          file: 'startAndroidInAppUpdate.ts',
          function: 'startAndroidInAppUpdate',
        },
      })
      return false
    }

    const updateOptions: StartUpdateOptions = {
      // A "flexible" update allows the user to continue to use the app while it updates in the background,
      // while an "immediate" update will not.
      updateType: isRequired ? IAUUpdateKind.IMMEDIATE : IAUUpdateKind.FLEXIBLE,
    }

    await inAppUpdates.startUpdate(updateOptions)

    logger.debug(
      'startAndroidInAppUpdate.ts',
      'startAndroidInAppUpdate',
      `Update flow started successfully (${isRequired ? 'immediate' : 'flexible'})`,
    )
    return true
  } catch (error) {
    // If an error happens, we log it and then the `ForceUpgradeModal` component will redirect to the Play Store.
    logger.error(error, {
      tags: {
        file: 'startAndroidInAppUpdate.ts',
        function: 'startAndroidInAppUpdate',
      },
    })
    return false
  }
}
