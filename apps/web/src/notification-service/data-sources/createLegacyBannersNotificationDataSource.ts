import {
  createNotificationDataSource,
  type NotificationDataSource,
  type NotificationTracker,
} from '@universe/notifications'
import { logger } from 'utilities/src/logger/logger'
import store from '~/state/index'

// Using 'local:' prefix to indicate these are client-only notifications
// This prevents the API tracker from sending AckNotification calls to the backend
const BRIDGING_BANNER_ID = 'local:bridging_popular_tokens_banner'

interface CreateLegacyBannersNotificationDataSourceContext {
  tracker: NotificationTracker
}

/**
 * Creates a notification data source whose only job is to migrate legacy banner
 * dismissal state (Bridging) into the notification system.
 *
 * This source no longer emits any notifications — it runs a one-time migration on
 * start so users who dismissed banners in the old system don't see them again.
 */
export function createLegacyBannersNotificationDataSource(
  ctx: CreateLegacyBannersNotificationDataSourceContext,
): NotificationDataSource {
  const { tracker } = ctx

  let hasMigratedLegacyState = false

  const migrateLegacyDismissalState = async (): Promise<void> => {
    if (hasMigratedLegacyState) {
      return
    }

    hasMigratedLegacyState = true

    try {
      // Migrate BridgingBanner dismissal from Redux
      const state = store.getState()
      const bridgingWasDismissed = state.uniswapBehaviorHistory.hasDismissedBridgedAssetsBannerV2
      if (bridgingWasDismissed) {
        logger.info(
          'createLegacyBannersNotificationDataSource',
          'migrateLegacyDismissalState',
          'Migrating Bridging banner dismissal from legacy Redux state',
        )
        await tracker.track(BRIDGING_BANNER_ID, { timestamp: Date.now() })
        // TODO: remove hasDismissedBridgedAssetsBannerV2 from redux with a migration
      }
    } catch (error) {
      logger.error(error, {
        tags: { file: 'createLegacyBannersNotificationDataSource', function: 'migrateLegacyDismissalState' },
      })
    }
  }

  const start = (): void => {
    migrateLegacyDismissalState().catch((error) => {
      logger.error(error, {
        tags: { file: 'createLegacyBannersNotificationDataSource', function: 'start' },
      })
    })
  }

  const stop = async (): Promise<void> => {}

  return createNotificationDataSource({ start, stop })
}
