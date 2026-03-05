import { type InAppNotification } from '@universe/api'
import {
  createIntervalNotificationDataSource,
  type NotificationDataSource,
  type NotificationTracker,
} from '@universe/notifications'
import type { MobileState } from 'src/app/mobileReducer'
import {
  checkBridgedAssetsBanner,
  checkBridgedAssetsV2Banner,
} from 'src/notification-service/data-sources/banners/bridgedAssetsBanners'
import { checkFundWalletBanner } from 'src/notification-service/data-sources/banners/fundWalletBanner'

import { checkNoAppFeesBanner } from 'src/notification-service/data-sources/banners/noAppFeesBanner'
import { checkPushNotificationsBanner } from 'src/notification-service/data-sources/banners/pushNotificationsBanner'
import { checkRecoveryBackup } from 'src/notification-service/data-sources/banners/recoveryBackupBanner'
import { BannerId } from 'src/notification-service/data-sources/banners/types'
import { checkUnitagClaim } from 'src/notification-service/data-sources/banners/unitagClaimBanner'
import { logger } from 'utilities/src/logger/logger'
import {
  selectHasDismissedNoAppFeesAnnouncement,
  selectHasSkippedUnitagPrompt,
  selectHasViewedBridgedAssetsCard,
  selectHasViewedBridgedAssetsV2Card,
  selectHasViewedNotificationsCard,
} from 'wallet/src/features/behaviorHistory/selectors'

interface CreateMobileLegacyBannersNotificationDataSourceContext {
  tracker: NotificationTracker
  pollIntervalMs?: number
  getState: () => MobileState
  getIsDarkMode: () => boolean
}

/**
 * Creates a notification data source that converts HomeIntroCardStack cards
 * into InAppNotifications compatible with the notification system.
 *
 * This replaces the legacy OnboardingIntroCardStack with notification system equivalents:
 * - No App Fees announcement
 * - Fund Wallet (empty wallet state)
 * - Recovery backup reminder
 * - Unitag claim prompt
 * - Push Notifications prompt
 * - Bridged Assets V1/V2 banners
 *
 * **Migration Logic:**
 * This data source checks for legacy dismissal state in Redux and automatically
 * migrates it to the notification system on first run.
 */
export function createMobileLegacyBannersNotificationDataSource(
  ctx: CreateMobileLegacyBannersNotificationDataSourceContext,
): NotificationDataSource {
  const { tracker, pollIntervalMs = 5000, getState, getIsDarkMode } = ctx
  let hasMigratedLegacyState = false

  /**
   * Migrates legacy dismissal state from Redux to the notification system.
   * This runs once on the first poll to ensure users who dismissed cards in the old system
   * don't see them again.
   */
  const migrateLegacyDismissalState = async (): Promise<void> => {
    if (hasMigratedLegacyState) {
      return
    }

    try {
      const state = getState()

      // Migrate Unitag skip state
      const hasSkippedUnitag = selectHasSkippedUnitagPrompt(state)
      if (hasSkippedUnitag) {
        logger.info(
          'createMobileLegacyBannersNotificationDataSource',
          'migrateLegacyDismissalState',
          'Migrating Unitag skip from legacy Redux state',
        )
        await tracker.track(BannerId.UnitagClaim, { timestamp: Date.now() })
      }

      // Migrate No App Fees dismissal
      const noAppFeesWasDismissed = selectHasDismissedNoAppFeesAnnouncement(state)
      if (noAppFeesWasDismissed) {
        logger.info(
          'createMobileLegacyBannersNotificationDataSource',
          'migrateLegacyDismissalState',
          'Migrating No App Fees announcement dismissal from legacy Redux state',
        )
        await tracker.track(BannerId.NoAppFees, { timestamp: Date.now() })
      }

      // Migrate Bridged Assets V1 dismissal
      const bridgedAssetsWasViewed = selectHasViewedBridgedAssetsCard(state)
      if (bridgedAssetsWasViewed) {
        logger.info(
          'createMobileLegacyBannersNotificationDataSource',
          'migrateLegacyDismissalState',
          'Migrating Bridged Assets V1 view from legacy Redux state',
        )
        await tracker.track(BannerId.BridgedAssets, { timestamp: Date.now() })
      }

      // Migrate Bridged Assets V2 dismissal
      const bridgedAssetsV2WasViewed = selectHasViewedBridgedAssetsV2Card(state)
      if (bridgedAssetsV2WasViewed) {
        logger.info(
          'createMobileLegacyBannersNotificationDataSource',
          'migrateLegacyDismissalState',
          'Migrating Bridged Assets V2 view from legacy Redux state',
        )
        await tracker.track(BannerId.BridgedAssetsV2, { timestamp: Date.now() })
      }

      // Migrate Push Notifications card dismissal
      const pushNotificationsWasViewed = selectHasViewedNotificationsCard(state)
      if (pushNotificationsWasViewed) {
        logger.info(
          'createMobileLegacyBannersNotificationDataSource',
          'migrateLegacyDismissalState',
          'Migrating Push Notifications card view from legacy Redux state',
        )
        await tracker.track(BannerId.PushNotifications, { timestamp: Date.now() })
      }

      hasMigratedLegacyState = true
    } catch (error) {
      logger.error(error, {
        tags: {
          file: 'createMobileLegacyBannersNotificationDataSource',
          function: 'migrateLegacyDismissalState',
        },
      })
    }
  }

  const pollForNotifications = async (): Promise<InAppNotification[]> => {
    try {
      // Run migration on first poll
      await migrateLegacyDismissalState()

      const notifications = await fetchNotifications(getState, getIsDarkMode)
      return notifications
    } catch (error) {
      logger.error(error, {
        tags: { file: 'createMobileLegacyBannersNotificationDataSource', function: 'pollForNotifications' },
      })
    }

    return []
  }

  const dataSource: NotificationDataSource = createIntervalNotificationDataSource({
    pollIntervalMs,
    source: 'legacy_intro_cards',
    logFileTag: 'createMobileLegacyBannersNotificationDataSource',
    getNotifications: pollForNotifications,
  })

  return dataSource
}

/**
 * Fetches all notifications based on current conditions.
 * The processor will handle filtering based on tracked/processed state.
 *
 * Priority order (matches useSharedIntroCards):
 * 1. No App Fees announcement (if enabled)
 * 2. Fund Wallet (if empty wallet)
 * 3. Recovery backup (if no external backup)
 * 4. Unitag claim (if eligible)
 * 5. Push Notifications (if not granted)
 * 6. Bridged Assets V2 (if enabled)
 * 7. Bridged Assets V1 (if enabled)
 */
async function fetchNotifications(
  getState: () => MobileState,
  getIsDarkMode: () => boolean,
): Promise<InAppNotification[]> {
  const notifications: InAppNotification[] = []

  // Priority 1: No App Fees announcement
  const noAppFeesNotification = await checkNoAppFeesBanner(getIsDarkMode())
  if (noAppFeesNotification) {
    notifications.push(noAppFeesNotification)
  }

  // Priority 2: Fund Wallet (empty wallet state)
  const fundWalletNotification = await checkFundWalletBanner(getState)
  if (fundWalletNotification) {
    notifications.push(fundWalletNotification)
  }

  // Priority 3: Recovery backup reminder
  const backupNotification = await checkRecoveryBackup(getState)
  if (backupNotification) {
    notifications.push(backupNotification)
  }

  // Priority 4: Unitag claim
  const unitagNotification = await checkUnitagClaim(getState)
  if (unitagNotification) {
    notifications.push(unitagNotification)
  }

  // Priority 5: Push Notifications
  const pushNotificationsNotification = await checkPushNotificationsBanner()
  if (pushNotificationsNotification) {
    notifications.push(pushNotificationsNotification)
  }

  // Priority 6: Bridged Assets V2
  const bridgedAssetsV2Notification = await checkBridgedAssetsV2Banner(getIsDarkMode())
  if (bridgedAssetsV2Notification) {
    notifications.push(bridgedAssetsV2Notification)
  }

  // Priority 7: Bridged Assets V1
  const bridgedAssetsNotification = await checkBridgedAssetsBanner()
  if (bridgedAssetsNotification) {
    notifications.push(bridgedAssetsNotification)
  }

  return notifications
}
