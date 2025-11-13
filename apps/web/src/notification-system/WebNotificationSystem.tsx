import { queryOptions, useQuery } from '@tanstack/react-query'
import { createFetchClient, createNotificationsApiClient, getEntryGatewayUrl, SharedQueryClient } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import {
  createApiNotificationTracker,
  createBaseNotificationProcessor,
  createNotificationSystem,
  createPollingNotificationDataSource,
  getIsNotificationSystemEnabled,
  getNotificationQueryOptions,
  type NotificationSystem,
} from '@universe/notifications'
import { createLocalStorageAdapter } from 'notification-system/createLocalStorageAdapter'
import { createLegacyBannersNotificationDataSource } from 'notification-system/data-sources/createLegacyBannersNotificationDataSource'
import { createWebNotificationRenderer } from 'notification-system/notification-renderer/createWebNotificationRenderer'
import { NotificationContainer } from 'notification-system/notification-renderer/NotificationContainer'
import { useNotificationStore } from 'notification-system/notification-renderer/notificationStore'
import { getNotificationTelemetry } from 'notification-system/telemetry/getNotificationTelemetry'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import store from 'state'
import { useIsDarkMode } from 'ui/src'
import { getLocale } from 'uniswap/src/features/language/hooks'
import { selectCurrentLanguage } from 'uniswap/src/features/settings/selectors'
import { getLogger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

/**
 * Creates the notification system with all necessary dependencies
 */
function provideWebNotificationSystem(ctx: {
  getIsDarkMode: () => boolean
  navigate: (path: string) => void
}): NotificationSystem {
  const notifApiBaseUrl = getEntryGatewayUrl()

  const fetchClient = createFetchClient({
    baseUrl: notifApiBaseUrl,
    getHeaders: () => {
      // Get the current language from Redux store and convert to Crowdin locale
      const currentLanguage = selectCurrentLanguage(store.getState())
      const locale = getLocale(currentLanguage)

      return {
        'Content-Type': 'application/json',
        'x-uniswap-locale': locale,
      }
    },
    getSessionServiceBaseUrl: getEntryGatewayUrl,
    defaultOptions: {
      credentials: 'include',
    },
  })

  const apiClient = createNotificationsApiClient({
    fetchClient,
    queryClient: SharedQueryClient,
    getApiPathPrefix: () => '', // Empty prefix if the full path is in the base URL
  })

  const queryOptions = getNotificationQueryOptions({
    apiClient,
    pollIntervalMs: 120000, // Poll every 2 minutes
  })

  const backendDataSource = createPollingNotificationDataSource({
    queryClient: SharedQueryClient,
    queryOptions,
  })

  const tracker = createApiNotificationTracker({
    notificationsApiClient: apiClient,
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

  const notificationSystem = createNotificationSystem({
    dataSources: [backendDataSource, bannersDataSource],
    tracker,
    processor,
    renderer,
    telemetry,
    onNavigate: (url: string) => {
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
        getLogger().warn('WebNotificationSystem', 'onNavigate', 'Failed to parse URL', { url, error })
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    },
  })

  return notificationSystem
}

/**
 * Query options factory for the notification system
 * Accepts the context needed to create the notification system
 */
function getNotificationSystemQueryOptions(ctx: {
  getIsDarkMode: () => boolean
  navigate: (path: string) => void
  getIsEnabled: () => boolean
}): QueryOptionsResult<NotificationSystem, Error, NotificationSystem, [ReactQueryCacheKey.NotificationSystem]> {
  return queryOptions({
    queryKey: [ReactQueryCacheKey.NotificationSystem],
    queryFn: () => provideWebNotificationSystem(ctx),
    enabled: ctx.getIsEnabled(),
    staleTime: Infinity, // Never refetch while mounted
    gcTime: 0, // Don't persist in cache - NotificationSystem has methods that can't be serialized
  })
}

export function WebNotificationSystemManager(): JSX.Element | null {
  const isNotificationSystemEnabledFlag = useFeatureFlag(FeatureFlags.NotificationSystem)
  const isNotificationSystemEnabled = getIsNotificationSystemEnabled() || isNotificationSystemEnabledFlag
  const location = useLocation()
  const navigate = useNavigate()

  // Don't show notifications on the landing page
  const shouldRenderNotifications = location.pathname !== '/'

  // Get current values for banner conditions (using refs to avoid recreating system)
  const isDarkMode = useIsDarkMode()
  const isDarkModeRef = useRef(isDarkMode)
  isDarkModeRef.current = isDarkMode

  const navigateRef = useRef(navigate)
  navigateRef.current = navigate

  const { data: notificationSystem } = useQuery(
    getNotificationSystemQueryOptions({
      getIsDarkMode: () => isDarkModeRef.current,
      navigate: (path: string) => navigateRef.current(path),
      getIsEnabled: () => isNotificationSystemEnabled,
    }),
  )

  useEffect(() => {
    if (!notificationSystem) {
      return undefined
    }

    notificationSystem.initialize().catch((error) => {
      getLogger().error(error, {
        tags: { file: 'WebNotificationSystem', function: 'initialize' },
        extra: { message: 'Failed to initialize notification system' },
      })
    })

    return () => {
      notificationSystem.destroy()
    }
  }, [notificationSystem])

  if (!isNotificationSystemEnabled || !shouldRenderNotifications || !notificationSystem) {
    return null
  }

  return (
    <NotificationContainer
      onRenderFailed={notificationSystem.onRenderFailed}
      onNotificationClick={notificationSystem.onNotificationClick}
    />
  )
}
