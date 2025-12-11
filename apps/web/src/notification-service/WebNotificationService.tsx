import { queryOptions, useQuery } from '@tanstack/react-query'
import {
  createFetchClient,
  createNotificationsApiClient,
  getEntryGatewayUrl,
  provideSessionService,
  SESSION_INIT_QUERY_KEY,
  SharedQueryClient,
} from '@universe/api'
import { FeatureFlags, getIsSessionServiceEnabled, useFeatureFlag } from '@universe/gating'
import {
  createApiNotificationTracker,
  createBaseNotificationProcessor,
  createNotificationService,
  createPollingNotificationDataSource,
  getIsNotificationServiceEnabled,
  getNotificationQueryOptions,
  type NotificationService,
} from '@universe/notifications'
import { createLocalStorageAdapter } from 'notification-service/createLocalStorageAdapter'
import { createLegacyBannersNotificationDataSource } from 'notification-service/data-sources/createLegacyBannersNotificationDataSource'
import { createWebNotificationRenderer } from 'notification-service/notification-renderer/createWebNotificationRenderer'
import { NotificationContainer } from 'notification-service/notification-renderer/NotificationContainer'
import { useNotificationStore } from 'notification-service/notification-renderer/notificationStore'
import { getNotificationTelemetry } from 'notification-service/telemetry/getNotificationTelemetry'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import store from 'state'
import { useIsDarkMode } from 'ui/src'
import { mapLocaleToBackendLocale } from 'uniswap/src/features/language/constants'
import { getLocale } from 'uniswap/src/features/language/hooks'
import { selectCurrentLanguage } from 'uniswap/src/features/settings/selectors'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { getLogger } from 'utilities/src/logger/logger'
import { REQUEST_SOURCE } from 'utilities/src/platform/requestSource'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

/**
 * Creates the notification service with all necessary dependencies
 */
function provideWebNotificationService(ctx: {
  getIsDarkMode: () => boolean
  navigate: (path: string) => void
  getIsApiDataSourceEnabled: () => boolean
}): NotificationService {
  const notifApiBaseUrl = getEntryGatewayUrl()

  const fetchClient = createFetchClient({
    baseUrl: notifApiBaseUrl,
    getHeaders: () => {
      // Get the current language from Redux store and convert to backend-supported locale format
      const currentLanguage = selectCurrentLanguage(store.getState())
      const locale = getLocale(currentLanguage)
      const backendLocale = mapLocaleToBackendLocale(locale)

      return {
        'Content-Type': 'application/json',
        'x-request-source': REQUEST_SOURCE,
        'x-uniswap-locale': backendLocale,
      }
    },
    getSessionService: () =>
      provideSessionService({ getBaseUrl: () => getEntryGatewayUrl(), getIsSessionServiceEnabled }),
    defaultOptions: {
      credentials: 'include',
    },
  })

  const apiClient = createNotificationsApiClient({
    fetchClient,
    getApiPathPrefix: () => '', // Empty prefix if the full path is in the base URL
  })

  const queryOptions = getNotificationQueryOptions({
    apiClient,
    pollIntervalMs: 120000, // Poll every 2 minutes
    getIsSessionInitialized: () => {
      const sessionData = SharedQueryClient.getQueryData(SESSION_INIT_QUERY_KEY)
      return !!sessionData
    },
  })

  const backendDataSource = createPollingNotificationDataSource({
    queryClient: SharedQueryClient,
    queryOptions,
  })

  const tracker = createApiNotificationTracker({
    notificationsApiClient: apiClient,
    queryClient: SharedQueryClient,
    storage: createLocalStorageAdapter(),
  })

  // Legacy banners that would conflict with the new notification system (Solana and Bridging)
  const bannersDataSource = createLegacyBannersNotificationDataSource({
    tracker,
    getIsDarkMode: ctx.getIsDarkMode,
    pollIntervalMs: 10000,
  })

  const processor = createBaseNotificationProcessor(tracker)

  const renderer = createWebNotificationRenderer({
    store: useNotificationStore,
  })

  const telemetry = getNotificationTelemetry()

  const dataSources = ctx.getIsApiDataSourceEnabled() ? [backendDataSource, bannersDataSource] : [bannersDataSource]

  const notificationService = createNotificationService({
    dataSources,
    tracker,
    processor,
    renderer,
    telemetry,
    onNavigate: (url: string) => {
      if (url.startsWith('/')) {
        ctx.navigate(url)
        return
      }

      try {
        // Parse the URL to check if it's same-origin
        const urlObj = new URL(url, window.location.origin)
        const isSameOrigin = urlObj.origin === window.location.origin

        if (isSameOrigin) {
          // Use internal navigation for same-origin links
          const path = urlObj.pathname + urlObj.search + urlObj.hash
          ctx.navigate(path)
        } else {
          // Open external links in new tab
          window.open(url, '_blank', 'noopener,noreferrer')
        }
      } catch (error) {
        // If URL parsing fails, fall back to opening in new tab
        getLogger().warn('WebNotificationService', 'onNavigate', 'Failed to parse URL', { url, error })
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    },
  })

  return notificationService
}

/**
 * Query options factory for the notification service
 * Accepts the context needed to create the notification service
 */
function getNotificationServiceQueryOptions(ctx: {
  getIsDarkMode: () => boolean
  navigate: (path: string) => void
  getIsEnabled: () => boolean
  getIsApiDataSourceEnabled: () => boolean
}): QueryOptionsResult<NotificationService, Error, NotificationService, [ReactQueryCacheKey.NotificationService]> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.NotificationService],
    queryFn: () => provideWebNotificationService(ctx),
    enabled: ctx.getIsEnabled(),
    staleTime: Infinity, // Never refetch while mounted
    gcTime: 0, // Don't persist in cache - NotificationService has methods that can't be serialized
  })
}

export function WebNotificationServiceManager(): JSX.Element | null {
  const isNotificationServiceEnabledFlag = useFeatureFlag(FeatureFlags.NotificationService)
  const isNotificationServiceEnabled =
    !isPlaywrightEnv() && (getIsNotificationServiceEnabled() || isNotificationServiceEnabledFlag)
  const isApiDataSourceEnabledFlag = useFeatureFlag(FeatureFlags.NotificationApiDataSource)
  const location = useLocation()
  const navigate = useNavigate()

  // Don't show notifications on the landing page
  const shouldRenderNotifications = location.pathname !== '/'

  // Get current values for banner conditions (using refs to avoid recreating system)
  const isDarkMode = useIsDarkMode()

  const { data: notificationService } = useQuery(
    getNotificationServiceQueryOptions({
      getIsDarkMode: () => isDarkMode,
      navigate: (path: string) => navigate(path),
      getIsEnabled: () => isNotificationServiceEnabled,
      getIsApiDataSourceEnabled: () => isApiDataSourceEnabledFlag,
    }),
  )

  useEffect(() => {
    if (!notificationService) {
      return undefined
    }

    notificationService.initialize().catch((error) => {
      getLogger().error(error, {
        tags: { file: 'WebNotificationService', function: 'initialize' },
        extra: { message: 'Failed to initialize notification service' },
      })
    })

    return () => {
      notificationService.destroy()
    }
  }, [notificationService])

  if (!isNotificationServiceEnabled || !shouldRenderNotifications || !notificationService) {
    return null
  }

  return (
    <NotificationContainer
      onRenderFailed={notificationService.onRenderFailed}
      onNotificationShown={notificationService.onNotificationShown}
      onNotificationClick={notificationService.onNotificationClick}
    />
  )
}
