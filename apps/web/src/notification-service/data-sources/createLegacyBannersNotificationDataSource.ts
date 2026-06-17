import {
  Background,
  Content,
  Notification,
  NotificationVersion,
  OnClick,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import { BackgroundType, ContentStyle, type InAppNotification, OnClickAction } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import {
  createNotificationDataSource,
  type NotificationDataSource,
  type NotificationTracker,
} from '@universe/notifications'
import {
  NO_FEES_ICON,
  NO_UNISWAP_INTERFACE_FEES_BANNER_DARK,
  NO_UNISWAP_INTERFACE_FEES_BANNER_LIGHT,
} from 'ui/src/assets'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import i18n from 'uniswap/src/i18n'
import { logger } from 'utilities/src/logger/logger'
import store from '~/state/index'

// Using 'local:' prefix to indicate these are client-only notifications
// This prevents the API tracker from sending AckNotification calls to the backend
const BRIDGING_BANNER_ID = 'local:bridging_popular_tokens_banner'
const NO_UNISWAP_INTERFACE_FEES_BANNER_ID = 'local:no_uniswap_interface_fees_banner'

interface CreateLegacyBannersNotificationDataSourceContext {
  tracker: NotificationTracker
  pollIntervalMs?: number
  getIsDarkMode: () => boolean
}

/**
 * Creates a notification data source that checks for "legacy" banner conditions
 * and returns them as InAppNotifications compatible with the notification system.
 *
 * These are banners that would be placed in the lower left corner of the screen
 * and would conflict with some of the first notifications shown by the notification system.
 *
 * These notifications eventually will be migrated to the new system fully, sent by onesignal.
 *
 * **Migration Logic:**
 * This data source checks for legacy dismissal state (localStorage and Redux) and
 * automatically migrates it to the notification system on first run.
 */
export function createLegacyBannersNotificationDataSource(
  ctx: CreateLegacyBannersNotificationDataSourceContext,
): NotificationDataSource {
  const { tracker, pollIntervalMs = 5000, getIsDarkMode } = ctx

  let intervalId: NodeJS.Timeout | null = null
  let currentCallback: ((notifications: InAppNotification[], source: string) => void) | null = null
  let hasMigratedLegacyState = false

  /**
   * Migrates legacy dismissal state from the old banner system to the notification system.
   * This runs once on the first poll to ensure users who dismissed banners in the old system
   * don't see them again.
   */
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

  const pollForNotifications = async (): Promise<void> => {
    if (!currentCallback) {
      return
    }

    try {
      // Run migration on first poll
      await migrateLegacyDismissalState()

      const isDarkMode = getIsDarkMode()
      const notifications = await fetchNotifications(isDarkMode)
      currentCallback(notifications, 'legacy_banners')
    } catch (error) {
      logger.error(error, {
        tags: { file: 'createLegacyBannersNotificationDataSource', function: 'pollForNotifications' },
      })
    }
  }

  const start = (onNotifications: (notifications: InAppNotification[], source: string) => void): void => {
    if (intervalId) {
      return
    }

    currentCallback = onNotifications

    pollForNotifications().catch((error) => {
      logger.error(error, {
        tags: { file: 'createLegacyBannersNotificationDataSource', function: 'start' },
      })
    })

    intervalId = setInterval(() => {
      pollForNotifications().catch((error) => {
        logger.error(error, {
          tags: { file: 'createLegacyBannersNotificationDataSource', function: 'setInterval' },
        })
      })
    }, pollIntervalMs)
  }

  const stop = async (): Promise<void> => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    currentCallback = null
  }

  return createNotificationDataSource({ start, stop })
}

/**
 * Fetches all notifications based on current conditions (feature flags only).
 * The processor will handle filtering based on tracked/processed state.
 */
async function fetchNotifications(isDarkMode: boolean): Promise<InAppNotification[]> {
  const notifications: InAppNotification[] = []

  const noUniswapInterfaceFeesBanner = await checkNoUniswapInterfaceFeesBanner(isDarkMode)
  if (noUniswapInterfaceFeesBanner) {
    notifications.push(noUniswapInterfaceFeesBanner)
  }

  return notifications
}

/**
 * Check if No Uniswap interface fees banner should be shown based on feature flag.
 * The processor will filter based on tracked state.
 */
async function checkNoUniswapInterfaceFeesBanner(isDarkMode: boolean): Promise<InAppNotification | null> {
  const isEnabled = getFeatureFlag(FeatureFlags.NoUniswapInterfaceFeesNotification)

  if (!isEnabled) {
    return null
  }

  return createNoUniswapInterfaceFeesBanner(isDarkMode)
}

/**
 * Create No Uniswap interface fees banner notification
 */
function createNoUniswapInterfaceFeesBanner(isDarkMode: boolean): InAppNotification {
  return new Notification({
    id: NO_UNISWAP_INTERFACE_FEES_BANNER_ID,
    content: new Content({
      version: NotificationVersion.V0,
      style: ContentStyle.LOWER_LEFT_BANNER,
      title: i18n.t('notification.noAppFees.title'),
      subtitle: i18n.t('notification.noAppFees.subtitle'),
      iconLink: NO_FEES_ICON,
      background: new Background({
        backgroundType: BackgroundType.IMAGE,
        link: isDarkMode ? NO_UNISWAP_INTERFACE_FEES_BANNER_DARK : NO_UNISWAP_INTERFACE_FEES_BANNER_LIGHT,
        backgroundOnClick: new OnClick({
          onClick: [OnClickAction.EXTERNAL_LINK, OnClickAction.DISMISS, OnClickAction.ACK],
          onClickLink: UniswapHelpUrls.articles.swapFeeInfo,
        }),
      }),
      onDismissClick: new OnClick({
        onClick: [OnClickAction.DISMISS, OnClickAction.ACK],
      }),
      buttons: [],
    }),
  })
}
