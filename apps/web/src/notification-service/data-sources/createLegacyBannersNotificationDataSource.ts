import {
  Background,
  Body,
  BodyItem,
  Button,
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
import store from 'state/index'
import {
  BRIDGED_ASSETS_V2_WEB_BANNER,
  NO_FEES_ICON,
  NO_UNISWAP_INTERFACE_FEES_BANNER_DARK,
  NO_UNISWAP_INTERFACE_FEES_BANNER_LIGHT,
  SOLANA_BANNER_DARK,
  SOLANA_BANNER_LIGHT,
  SOLANA_LOGO,
} from 'ui/src/assets'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import i18n from 'uniswap/src/i18n'
import { logger } from 'utilities/src/logger/logger'

// Legacy storage keys from the old banner implementation
const LEGACY_SOLANA_PROMO_STORAGE_KEY = 'solanaPromoHidden'
// Using 'local:' prefix to indicate these are client-only notifications
// This prevents the API tracker from sending AckNotification calls to the backend
const SOLANA_BANNER_ID = 'local:solana_promo_banner'
const SOLANA_MODAL_ID = 'local:solana_promo_modal'
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
      // Migrate SolanaPromo dismissal from localStorage
      const solanaWasDismissed = localStorage.getItem(LEGACY_SOLANA_PROMO_STORAGE_KEY) === 'true'
      if (solanaWasDismissed) {
        logger.info(
          'createLegacyBannersNotificationDataSource',
          'migrateLegacyDismissalState',
          'Migrating Solana banner dismissal from legacy localStorage',
        )
        await tracker.track(SOLANA_BANNER_ID, { timestamp: Date.now() })
        // Clean up legacy storage
        localStorage.removeItem(LEGACY_SOLANA_PROMO_STORAGE_KEY)
      }

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

  // Priority 1: No Uniswap interface fees banner
  const noUniswapInterfaceFeesBanner = await checkNoUniswapInterfaceFeesBanner(isDarkMode)
  if (noUniswapInterfaceFeesBanner) {
    notifications.push(noUniswapInterfaceFeesBanner)
  }

  // Priority 2: SolanaPromoBanner + Modal (chained)
  const solanaNotifications = await checkSolanaPromo(isDarkMode)
  notifications.push(...solanaNotifications)

  // Priority 3: BridgingPopularTokensBanner
  const bridgingNotification = await checkBridgingBanner()
  if (bridgingNotification) {
    notifications.push(bridgingNotification)
  }

  return notifications
}

/**
 * Check if No Uniswap interface fees banner should be shown based on feature flag.
 * The processor will filter based on tracked state.
 */
async function checkNoUniswapInterfaceFeesBanner(isDarkMode: boolean): Promise<InAppNotification | null> {
  const isEnabled = getFeatureFlag(FeatureFlags.NoUniswapInterfaceFees)

  if (!isEnabled) {
    return null
  }

  return createNoUniswapInterfaceFeesBanner(isDarkMode)
}

/**
 * Check if SolanaPromo banner should be shown based on feature flag.
 * Returns both banner and modal (modal is chained).
 * The processor will filter based on tracked state.
 */
async function checkSolanaPromo(isDarkMode: boolean): Promise<InAppNotification[]> {
  const isEnabled = getFeatureFlag(FeatureFlags.SolanaPromo)

  if (!isEnabled) {
    return []
  }

  // Processor will identify modal as chained due to POPUP action
  return [createSolanaPromoBanner(isDarkMode), createSolanaPromoModal()]
}

/**
 * Check if BridgingPopularTokens banner should be shown based on feature flag.
 * The processor will filter based on tracked state.
 */
async function checkBridgingBanner(): Promise<InAppNotification | null> {
  const isEnabled = getFeatureFlag(FeatureFlags.BridgedAssetsBannerV2)

  if (!isEnabled) {
    return null
  }

  return createBridgingBanner()
}

/**
 * Create SolanaPromoBanner notification
 */
function createSolanaPromoBanner(isDarkMode: boolean): InAppNotification {
  const bannerImage = isDarkMode ? SOLANA_BANNER_DARK : SOLANA_BANNER_LIGHT

  return new Notification({
    id: SOLANA_BANNER_ID,
    content: new Content({
      version: NotificationVersion.V0,
      style: ContentStyle.LOWER_LEFT_BANNER,
      title: i18n.t('solanaPromo.banner.title'),
      subtitle: i18n.t('solanaPromo.banner.description'),
      background: new Background({
        backgroundType: BackgroundType.IMAGE,
        link: bannerImage,
        backgroundOnClick: new OnClick({
          onClick: [OnClickAction.POPUP, OnClickAction.DISMISS, OnClickAction.ACK],
          onClickLink: SOLANA_MODAL_ID, // Links to chained modal
        }),
      }),
      onDismissClick: new OnClick({
        onClick: [OnClickAction.DISMISS, OnClickAction.ACK],
      }),
      buttons: [],
      iconLink: SOLANA_LOGO,
    }),
  })
}

/**
 * Create SolanaPromoModal notification (chained)
 */
function createSolanaPromoModal(): InAppNotification {
  return new Notification({
    id: SOLANA_MODAL_ID,
    content: new Content({
      version: NotificationVersion.V0,
      style: ContentStyle.MODAL,
      title: i18n.t('solanaPromo.banner.title'),
      subtitle: i18n.t('solanaPromo.banner.description'),
      background: new Background({
        backgroundType: BackgroundType.IMAGE,
        link: SOLANA_BANNER_LIGHT,
      }),
      iconLink: SOLANA_LOGO,
      body: new Body({
        items: [
          new BodyItem({
            text: i18n.t('solanaPromo.modal.swapInstantly'),
            iconUrl: 'custom:lightning-$accent1',
          }),
          new BodyItem({
            text: i18n.t('solanaPromo.modal.connectWallet'),
            iconUrl: 'custom:wallet-$accent1',
          }),
          new BodyItem({
            text: i18n.t('solanaPromo.modal.viewTokenData'),
            iconUrl: 'custom:chart-$accent1',
          }),
        ],
      }),
      onDismissClick: new OnClick({
        onClick: [OnClickAction.DISMISS, OnClickAction.ACK],
      }),
      buttons: [
        new Button({
          text: i18n.t('solanaPromo.modal.startSwapping.button'),
          isPrimary: true,
          onClick: new OnClick({
            onClick: [OnClickAction.EXTERNAL_LINK, OnClickAction.ACK, OnClickAction.DISMISS],
            onClickLink: '/swap?chain=solana',
          }),
        }),
      ],
    }),
  })
}

/**
 * Create BridgingPopularTokensBanner notification
 */
function createBridgingBanner(): InAppNotification {
  return new Notification({
    id: BRIDGING_BANNER_ID,
    content: new Content({
      version: NotificationVersion.V0,
      style: ContentStyle.LOWER_LEFT_BANNER,
      title: i18n.t('onboarding.home.intro.bridgedAssets.title'),
      subtitle: i18n.t('bridgingPopularTokens.banner.description'),
      background: new Background({
        backgroundType: BackgroundType.IMAGE,
        link: BRIDGED_ASSETS_V2_WEB_BANNER,
        backgroundOnClick: new OnClick({
          onClick: [OnClickAction.EXTERNAL_LINK, OnClickAction.DISMISS, OnClickAction.ACK],
          onClickLink: '/swap?outputChain=unichain',
        }),
      }),
      onDismissClick: new OnClick({
        onClick: [OnClickAction.DISMISS, OnClickAction.ACK],
      }),
      buttons: [],
    }),
  })
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
          onClickLink: uniswapUrls.helpArticleUrls.swapFeeInfo,
        }),
      }),
      onDismissClick: new OnClick({
        onClick: [OnClickAction.DISMISS, OnClickAction.ACK],
      }),
      buttons: [],
    }),
  })
}
