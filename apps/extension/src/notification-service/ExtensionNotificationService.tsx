import { queryOptions } from '@tanstack/react-query'
import { PlatformType } from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import {
  createFetchClient,
  createNotificationsApiClient,
  getEntryGatewayUrl,
  provideSessionService,
  SharedQueryClient,
} from '@universe/api'
import { SESSION_INIT_QUERY_KEY } from '@universe/api/src/components/ApiInit'
import { getIsSessionServiceEnabled } from '@universe/gating'
import {
  createApiNotificationTracker,
  createBaseNotificationProcessor,
  createNotificationService,
  createPollingNotificationDataSource,
  createReactiveDataSource,
  getNotificationQueryOptions,
  type NotificationService,
} from '@universe/notifications'
import ms from 'ms'
import { UnitagClaimRoutes } from 'src/app/navigation/constants'
import { focusOrCreateUniswapInterfaceTab, focusOrCreateUnitagTab } from 'src/app/navigation/utils'
import { createChromeStorageAdapter } from 'src/notification-service/createChromeStorageAdapter'
import { createExtensionLegacyBannersNotificationDataSource } from 'src/notification-service/data-sources/createExtensionLegacyBannersNotificationDataSource'
import { createStorageWarningCondition } from 'src/notification-service/data-sources/reactive/storageWarningCondition'
import { createExtensionNotificationRenderer } from 'src/notification-service/notification-renderer/createExtensionNotificationRenderer'
import { extensionNotificationStore } from 'src/notification-service/notification-renderer/notificationStore'
import { getNotificationTelemetry } from 'src/notification-service/notification-telemetry/getNotificationTelemetry'
import { createExtensionLocalTriggerDataSource } from 'src/notification-service/triggers/createExtensionLocalTriggerDataSource'
import { getReduxStore } from 'src/store/store'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { mapLocaleToBackendLocale } from 'uniswap/src/features/language/constants'
import { getLocale } from 'uniswap/src/features/language/navigatorLocale'
import { selectCurrentLanguage } from 'uniswap/src/features/settings/selectors'
import { getLogger } from 'utilities/src/logger/logger'
import { REQUEST_SOURCE } from 'utilities/src/platform/requestSource'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

/**
 * Checks if the session has been initialized by looking at the React Query cache.
 * Returns true if the session initialization query has completed successfully.
 */
function getIsSessionInitialized(): boolean {
  const sessionState = SharedQueryClient.getQueryState(SESSION_INIT_QUERY_KEY)
  return sessionState?.status === 'success'
}

/**
 * Creates the notification service with all necessary dependencies
 */
function provideExtensionNotificationService(ctx: {
  navigate: (path: string) => void
  getIsApiDataSourceEnabled: () => boolean
  getReduxStore: () => ReturnType<typeof getReduxStore>
}): NotificationService {
  const isApiDataSourceEnabled = ctx.getIsApiDataSourceEnabled()
  const notifApiBaseUrl = getEntryGatewayUrl()

  const fetchClient = createFetchClient({
    baseUrl: notifApiBaseUrl,
    getHeaders: () => {
      const currentLanguage = selectCurrentLanguage(getReduxStore().getState())
      const locale = getLocale(currentLanguage)
      const backendLocale = mapLocaleToBackendLocale(locale)

      return {
        'Content-Type': 'application/json',
        'x-request-source': REQUEST_SOURCE,
        'x-uniswap-locale': backendLocale,
      }
    },
    getSessionService: () =>
      provideSessionService({
        getBaseUrl: () => getEntryGatewayUrl(),
        getIsSessionServiceEnabled,
      }),
  })

  const apiClient = createNotificationsApiClient({
    fetchClient,
    getApiPathPrefix: () => '', // Empty prefix if the full path is in the base URL
  })

  const notifQueryOptions = getNotificationQueryOptions({
    apiClient,
    getPlatformType: () => PlatformType.EXTENSION,
    pollIntervalMs: 120000, // Poll every 2 minutes
    getIsSessionInitialized, // Check session state before making API calls
  })

  const backendDataSource = createPollingNotificationDataSource({
    queryClient: SharedQueryClient,
    queryOptions: notifQueryOptions,
  })

  const tracker = createApiNotificationTracker({
    notificationsApiClient: apiClient,
    queryClient: SharedQueryClient,
    storage: createChromeStorageAdapter(),
  })

  const bannersDataSource = createExtensionLegacyBannersNotificationDataSource({
    tracker,
    pollIntervalMs: ms('10s'),
  })

  const localTriggersDataSource = createExtensionLocalTriggerDataSource({
    getState: () => ctx.getReduxStore().getState(),
    dispatch: ctx.getReduxStore().dispatch,
    tracker,
    pollIntervalMs: ms('5s'),
  })

  // Reactive data source for storage warning - shows when storage is low
  // Note: isOnboarding=false for the main app (onboarding has its own context)
  const storageWarningDataSource = createReactiveDataSource({
    condition: createStorageWarningCondition({ isOnboarding: false }),
    tracker,
    source: 'system_alerts',
    logFileTag: 'storageWarningCondition',
  })

  const processor = createBaseNotificationProcessor(tracker)

  const renderer = createExtensionNotificationRenderer({
    store: extensionNotificationStore,
  })

  const telemetry = getNotificationTelemetry()

  const dataSources = isApiDataSourceEnabled
    ? [backendDataSource, bannersDataSource, localTriggersDataSource, storageWarningDataSource]
    : [bannersDataSource, localTriggersDataSource, storageWarningDataSource]

  const onNavigate = (url: string) => {
    // Handle explore paths by opening in web interface
    if (url.startsWith('/explore/')) {
      focusOrCreateUniswapInterfaceTab({
        url: `${uniswapUrls.requestOriginUrl}${url}`,
      }).catch((error) => {
        getLogger().error(error, {
          tags: {
            file: 'ExtensionNotificationService',
            function: 'onNavigate',
          },
          extra: { url },
        })
      })
      return
    }

    // Handle internal navigation (paths starting with /)
    if (url.startsWith('/')) {
      ctx.navigate(url)
      return
    }

    // Handle special unitag:// protocol for opening unitag claim tabs
    if (url.startsWith('unitag://claim/')) {
      const route = url.replace('unitag://claim/', '')
      const state = ctx.getReduxStore().getState()
      const activeAddress = state.wallet.activeAccountAddress
      if (activeAddress) {
        focusOrCreateUnitagTab(activeAddress, route as UnitagClaimRoutes).catch((error) => {
          getLogger().error(error, {
            tags: {
              file: 'ExtensionNotificationService',
              function: 'onNavigate',
            },
            extra: { url },
          })
        })
      }
      return
    }

    // All other URLs are external - open in new tab
    window.open(url, '_blank')
  }

  const notificationService = createNotificationService({
    dataSources,
    tracker,
    processor,
    renderer,
    telemetry,
    onNavigate,
  })

  return notificationService
}

/**
 * Query options factory for the notification service.
 *
 * NOTE: The query key includes isApiDataSourceEnabled to ensure a new service
 * is created when the feature flag changes. Without this, the cached service
 * would continue using stale data sources.
 */
export function getNotificationServiceQueryOptions(ctx: {
  navigate: (path: string) => void
  getIsEnabled: () => boolean
  getIsApiDataSourceEnabled: () => boolean
  getReduxStore: () => ReturnType<typeof getReduxStore>
}): QueryOptionsResult<
  NotificationService,
  Error,
  NotificationService,
  [ReactQueryCacheKey.NotificationService, { isApiDataSourceEnabled: boolean }]
> {
  const isApiDataSourceEnabled = ctx.getIsApiDataSourceEnabled()
  const isEnabled = ctx.getIsEnabled()

  return queryOptions({
    // Include feature flag in query key so service is recreated when flag changes
    queryKey: [ReactQueryCacheKey.NotificationService, { isApiDataSourceEnabled }],
    queryFn: () => provideExtensionNotificationService(ctx),
    enabled: isEnabled,
    staleTime: Infinity, // Never refetch while mounted
    gcTime: 0, // Don't persist in cache - NotificationService has methods that can't be serialized
  })
}
