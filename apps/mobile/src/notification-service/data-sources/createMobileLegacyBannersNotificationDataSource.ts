import { type InAppNotification } from '@universe/api'
import {
  createIntervalNotificationDataSource,
  type NotificationDataSource,
  type NotificationTracker,
} from '@universe/notifications'
import type { MobileState } from 'src/app/mobileReducer'
import { checkFundWalletBanner } from 'src/notification-service/data-sources/banners/fundWalletBanner'
import { checkPushNotificationsBanner } from 'src/notification-service/data-sources/banners/pushNotificationsBanner'
import { checkRecoveryBackup } from 'src/notification-service/data-sources/banners/recoveryBackupBanner'
import { BannerId } from 'src/notification-service/data-sources/banners/types'
import { checkUnitagClaim } from 'src/notification-service/data-sources/banners/unitagClaimBanner'
import { logger } from 'utilities/src/logger/logger'
import { selectHasViewedNotificationsCard } from 'wallet/src/features/behaviorHistory/selectors'

interface CreateMobileLegacyBannersNotificationDataSourceContext {
  tracker: NotificationTracker
  pollIntervalMs?: number
  getState: () => MobileState
}

/**
 * Creates a notification data source that converts HomeIntroCardStack cards
 * into InAppNotifications compatible with the notification system.
 *
 * This replaces the legacy OnboardingIntroCardStack with notification system equivalents:
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
  const { tracker, pollIntervalMs = 5000, getState } = ctx
  let hasMigratedLegacyState = false

  /**
   * Migrates legacy dismissal state from Redux to the notification system.
   * This runs once on the first poll to ensure users who dismissed cards in the old system
   * don't see them again.
   *
   * Note: `hasSkippedUnitagPrompt` is intentionally NOT migrated. In the legacy flow it was
   * dispatched after the create-new onboarding step (not on user dismissal of the banner),
   * so migrating it would permanently suppress the UnitagClaim banner for every new mobile
   * wallet. Eligibility for that banner is determined solely by whether the active account
   * already has a unitag — see `checkUnitagClaim`.
   */
  const migrateLegacyDismissalState = async (): Promise<void> => {
    if (hasMigratedLegacyState) {
      return
    }

    try {
      const state = getState()

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

      const notifications = await fetchNotifications(getState)
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
 * 1. Fund Wallet (if empty wallet)
 * 2. Recovery backup (if no external backup)
 * 3. Unitag claim (if eligible)
 * 4. Push Notifications (if not granted)
 */
async function fetchNotifications(getState: () => MobileState): Promise<InAppNotification[]> {
  const notifications: InAppNotification[] = []

  // Priority 1: Fund Wallet (empty wallet state)
  const fundWalletNotification = await checkFundWalletBanner(getState)
  if (fundWalletNotification) {
    notifications.push(fundWalletNotification)
  }

  // Priority 2: Recovery backup reminder
  const backupNotification = await checkRecoveryBackup(getState)
  if (backupNotification) {
    notifications.push(backupNotification)
  }

  // Priority 3: Unitag claim
  const unitagNotification = await checkUnitagClaim(getState)
  if (unitagNotification) {
    notifications.push(unitagNotification)
  }

  // Priority 4: Push Notifications
  const pushNotificationsNotification = await checkPushNotificationsBanner()
  if (pushNotificationsNotification) {
    notifications.push(pushNotificationsNotification)
  }

  return notifications
}
