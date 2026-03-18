import {
  Content,
  ContentStyle,
  Notification,
  OnClick,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import { type InAppNotification, OnClickAction } from '@universe/api'
import { DynamicConfigs, getDynamicConfigValue, OutageBannerChainIdConfigKey } from '@universe/gating'
import { createNotificationDataSource } from '@universe/notifications/src/notification-data-source/implementations/createNotificationDataSource'
import { type NotificationDataSource } from '@universe/notifications/src/notification-data-source/NotificationDataSource'
import { capitalize } from 'tsafe'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { DEFAULT_MS_BEFORE_WARNING } from 'uniswap/src/features/chains/evm/rpc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import i18n from 'uniswap/src/i18n'
import { getLogger } from 'utilities/src/logger/logger'
import { useManualChainOutageStore } from '~/state/outage/store'
import { ChainOutageData } from '~/state/outage/types'
import { getChainIdFromChainUrlParam } from '~/utils/chainParams'
import { getCurrentPageFromLocation } from '~/utils/urlRoutes'

/**
 * System alert types in priority order (highest first).
 * When multiple alerts are active, only the highest priority is shown.
 */
enum SystemAlertType {
  /** Chain connectivity warning - block timestamp significantly behind machine time */
  ChainConnectivity = 'chain_connectivity',
  /** Chain/protocol outage - GraphQL errors or configured outage */
  Outage = 'outage',
}

const DEFAULT_POLL_INTERVAL_MS = 5000
const LOG_FILE_TAG = 'createSystemAlertsDataSource'

/**
 * Priority order for system alerts.
 * Lower index = higher priority.
 */
const ALERT_PRIORITY: SystemAlertType[] = [SystemAlertType.ChainConnectivity, SystemAlertType.Outage]

/**
 * Pages where outage banners should be displayed.
 */
const OUTAGE_DISPLAY_PAGES: InterfacePageName[] = [
  InterfacePageName.ExplorePage,
  InterfacePageName.TokenDetailsPage,
  InterfacePageName.PoolDetailsPage,
  InterfacePageName.TokensPage,
]

/**
 * Dependencies that must be provided from React hooks.
 * These are passed as getter functions to allow checking at poll time.
 */
interface CreateSystemAlertsDataSourceContext {
  /** Get the current swap input chain ID (from UniswapContext) */
  getSwapInputChainId: () => UniverseChainId | undefined
  /** Get the current block timestamp (from useCurrentBlockTimestamp) */
  getBlockTimestamp: () => bigint | undefined
  /** Get the current machine time in ms (from useMachineTimeMs) */
  getMachineTime: () => number
  /** Get the current pathname (from useLocation) */
  getPathname: () => string
  /** Polling interval in milliseconds (default: 5000ms) */
  pollIntervalMs?: number
}

/**
 * Gets the chain outage from dynamic config.
 * This is a non-hook alternative to useChainOutageConfig.
 */
function getChainOutageConfig(): ChainOutageData | undefined {
  const chainId = getDynamicConfigValue({
    config: DynamicConfigs.OutageBannerChainId,
    key: OutageBannerChainIdConfigKey.ChainId,
    defaultValue: undefined,
    customTypeGuard: (x): x is UniverseChainId | undefined => {
      return x === undefined || (typeof x === 'number' && x > 0)
    },
  })

  if (!chainId) {
    return undefined
  }

  return { chainId }
}

/**
 * Gets the chain ID from a URL pathname by extracting the chain URL param segment.
 */
function getChainIdFromPathname(pathname: string): UniverseChainId | undefined {
  const segments = pathname.split('/').filter(Boolean)

  // Try each segment as a chain URL param
  for (const segment of segments) {
    const chainId = getChainIdFromChainUrlParam(segment.toLowerCase())
    if (chainId !== undefined) {
      return chainId
    }
  }

  return UniverseChainId.Mainnet
}

/**
 * Checks if chain connectivity warning should be shown.
 */
function checkChainConnectivity(ctx: {
  swapInputChainId: UniverseChainId | undefined
  blockTimestamp: bigint | undefined
  machineTime: number
  isLandingPage: boolean
  occurrence: number
}): { shouldShow: boolean; notification?: InAppNotification } {
  const { swapInputChainId, blockTimestamp, machineTime, isLandingPage, occurrence } = ctx

  // Don't show on landing page
  if (isLandingPage) {
    return { shouldShow: false }
  }

  // Need chain ID and block timestamp to check
  if (!swapInputChainId || !blockTimestamp) {
    return { shouldShow: false }
  }

  const chainInfo = getChainInfo(swapInputChainId)
  const waitMsBeforeWarning = chainInfo.blockWaitMsBeforeWarning ?? DEFAULT_MS_BEFORE_WARNING

  // Check if block is stale
  const blockTimeMs = Number(blockTimestamp) * 1000
  const isStale = machineTime - blockTimeMs > waitMsBeforeWarning

  if (!isStale) {
    return { shouldShow: false }
  }

  return {
    shouldShow: true,
    notification: createChainConnectivityNotification({
      chainLabel: chainInfo.label,
      chainId: swapInputChainId,
      isMainnet: swapInputChainId === UniverseChainId.Mainnet,
      statusPageUrl: chainInfo.statusPage,
      occurrence,
    }),
  }
}

/**
 * Checks if outage banner should be shown.
 */
function checkOutage(ctx: {
  errorOutage: ChainOutageData | undefined
  configOutage: ChainOutageData | undefined
  currentPage: InterfacePageName | undefined
  pageChainId: UniverseChainId | undefined
}): { shouldShow: boolean; notification?: InAppNotification } {
  const { errorOutage, configOutage, currentPage, pageChainId } = ctx

  // Use error-detected outage first, fall back to config
  const outage = errorOutage || configOutage

  if (!outage) {
    return { shouldShow: false }
  }

  // Only show on specific pages
  if (!currentPage || !OUTAGE_DISPLAY_PAGES.includes(currentPage)) {
    return { shouldShow: false }
  }

  // Only show if outage chain matches page chain
  if (outage.chainId !== pageChainId) {
    return { shouldShow: false }
  }

  // Get chain info safely - if urlParam doesn't exist, don't show the banner
  const chainInfo = getChainInfo(outage.chainId)
  if (!chainInfo.urlParam) {
    return { shouldShow: false }
  }

  const chainName = capitalize(chainInfo.urlParam)

  return {
    shouldShow: true,
    notification: createOutageNotification({
      chainId: outage.chainId,
      chainName,
      version: outage.version?.toString(),
      helpUrl: uniswapUrls.helpArticleUrls.subgraphDowntime,
    }),
  }
}

/**
 * Creates a data source for web system alerts (chain connectivity, outage warnings).
 *
 * Features:
 * - Polls conditions periodically
 * - Priority-based display (only shows highest priority active alert)
 * - Reads Zustand stores and dynamic config directly (no refs needed)
 * - Uses i18n for all user-facing strings
 *
 * @example
 * ```typescript
 * const systemAlertsDataSource = createSystemAlertsDataSource({
 *   getSwapInputChainId: () => swapInputChainIdRef.current,
 *   getBlockTimestamp: () => blockTimestampRef.current,
 *   getMachineTime: () => machineTimeRef.current,
 *   getPathname: () => pathnameRef.current,
 * })
 * ```
 */
export function createSystemAlertsDataSource(ctx: CreateSystemAlertsDataSourceContext): NotificationDataSource {
  const {
    getSwapInputChainId,
    getBlockTimestamp,
    getMachineTime,
    getPathname,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  } = ctx

  let intervalId: ReturnType<typeof setInterval> | null = null
  let currentCallback: ((notifications: InAppNotification[], source: string) => void) | null = null
  let lastEmittedAlertType: SystemAlertType | null = null
  // Counter for generating unique notification IDs per chain connectivity occurrence.
  // Increments each time the alert transitions from inactive to active,
  // so dismissed notifications stay dismissed and new occurrences get a fresh notification.
  let chainConnectivityOccurrence = 0

  /**
   * Check all conditions and return the highest priority active alert.
   */
  const getActiveAlert = (): { type: SystemAlertType; notification: InAppNotification } | null => {
    const pathname = getPathname()
    const isLandingPage = pathname === '/'
    const currentPage = getCurrentPageFromLocation(pathname)
    const pageChainId = getChainIdFromPathname(pathname)

    // Read stores directly (non-hook pattern)
    const errorOutage = useManualChainOutageStore.getState().data
    const configOutage = getChainOutageConfig()

    const checkers: Record<SystemAlertType, () => { shouldShow: boolean; notification?: InAppNotification }> = {
      [SystemAlertType.ChainConnectivity]: () =>
        checkChainConnectivity({
          swapInputChainId: getSwapInputChainId(),
          blockTimestamp: getBlockTimestamp(),
          machineTime: getMachineTime(),
          isLandingPage,
          occurrence: chainConnectivityOccurrence,
        }),
      [SystemAlertType.Outage]: () =>
        checkOutage({
          errorOutage,
          configOutage,
          currentPage,
          pageChainId,
        }),
    }

    for (const alertType of ALERT_PRIORITY) {
      try {
        const result = checkers[alertType]()
        if (result.shouldShow && result.notification) {
          return { type: alertType, notification: result.notification }
        }
      } catch (error) {
        getLogger().error(error, {
          tags: { file: LOG_FILE_TAG, function: 'getActiveAlert' },
          extra: { alertType },
        })
      }
    }

    return null
  }

  const checkAndEmit = (): void => {
    if (!currentCallback) {
      return
    }

    try {
      const activeAlert = getActiveAlert()

      if (activeAlert) {
        // Only emit if alert type changed to avoid unnecessary updates
        if (lastEmittedAlertType !== activeAlert.type) {
          lastEmittedAlertType = activeAlert.type
          currentCallback([activeAlert.notification], 'system_alerts')
        }
      } else if (lastEmittedAlertType !== null) {
        // When an alert clears, bump the occurrence counter so that the next
        // chain connectivity alert gets a fresh notification ID. This means
        // previously dismissed notifications stay dismissed.
        if (lastEmittedAlertType === SystemAlertType.ChainConnectivity) {
          chainConnectivityOccurrence++
        }
        lastEmittedAlertType = null
      }
    } catch (error) {
      getLogger().error(error, {
        tags: { file: LOG_FILE_TAG, function: 'checkAndEmit' },
      })
    }
  }

  const start = (onNotifications: (notifications: InAppNotification[], source: string) => void): void => {
    if (intervalId) {
      return
    }

    currentCallback = onNotifications
    lastEmittedAlertType = null

    // Check immediately on start
    checkAndEmit()

    // Then poll at interval
    intervalId = setInterval(checkAndEmit, pollIntervalMs)
  }

  const stop = async (): Promise<void> => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    currentCallback = null
    lastEmittedAlertType = null
  }

  return createNotificationDataSource({ start, stop })
}

// ============================================================================
// Helper functions for creating system alert notifications
// ============================================================================

/**
 * Creates a chain connectivity warning notification.
 */
function createChainConnectivityNotification(params: {
  chainLabel: string
  chainId: number
  isMainnet: boolean
  statusPageUrl?: string
  occurrence: number
}): InAppNotification {
  const { chainLabel, chainId, isMainnet, statusPageUrl, occurrence } = params

  const title = i18n.t('network.warning')
  const subtitle = isMainnet ? i18n.t('network.lostConnection') : i18n.t('network.mightBeDown', { network: chainLabel })

  const notification = new Notification({
    id: `local:session:chain_connectivity:${chainId}:${occurrence}`,
    content: new Content({
      style: ContentStyle.SYSTEM_BANNER,
      title,
      subtitle,
      iconLink: 'custom:caution-triangle',
      onDismissClick: new OnClick({
        onClick: [OnClickAction.DISMISS, OnClickAction.ACK],
      }),
      buttons: statusPageUrl
        ? [
            {
              text: i18n.t('common.button.learn'),
              isPrimary: false,
              onClick: new OnClick({
                onClick: [OnClickAction.EXTERNAL_LINK],
                onClickLink: statusPageUrl,
              }),
            },
          ]
        : [],
    }),
  })

  return notification
}

/**
 * Creates an outage banner notification.
 */
function createOutageNotification(params: {
  chainId: number
  chainName: string
  version?: string
  helpUrl: string
}): InAppNotification {
  const { chainId, chainName, version, helpUrl } = params

  const versionName = version
    ? i18n.t('outageBanner.title', { versionName: `${version} data` })
    : i18n.t('outageBanner.title', { versionName: 'Data' })
  const versionDescription = version ? ` ${version.toLowerCase()}` : ''

  const notification = new Notification({
    id: `local:session:outage:${chainId}${version ? `:${version}` : ''}`,
    content: new Content({
      style: ContentStyle.SYSTEM_BANNER,
      title: versionName,
      subtitle: i18n.t('outageBanner.message', { chainName, versionDescription }),
      iconLink: 'custom:globe',
      onDismissClick: new OnClick({
        onClick: [OnClickAction.DISMISS, OnClickAction.ACK],
      }),
      buttons: [
        {
          text: i18n.t('common.button.learn'),
          isPrimary: false,
          onClick: new OnClick({
            onClick: [OnClickAction.EXTERNAL_LINK],
            onClickLink: helpUrl,
          }),
        },
      ],
    }),
  })

  return notification
}
