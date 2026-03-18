import { toPlainMessage } from '@bufbuild/protobuf'
import { queryOptions } from '@tanstack/react-query'
import { PlatformType } from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import type { InAppNotification, NotificationsApiClient } from '@universe/api'
import { getLogger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const DEFAULT_POLL_INTERVAL_MS = 2 * ONE_MINUTE_MS

interface GetNotificationQueryOptionsContext {
  apiClient: NotificationsApiClient
  getPlatformType: () => PlatformType
  pollIntervalMs?: number
  getIsSessionInitialized?: () => boolean
}

/**
 * Creates query options for polling notifications.
 * This can be used directly in hooks or injected into the notification data source.
 *
 * @example
 * ```typescript
 * import { getNotificationQueryOptions } from '@universe/notifications'
 * import { useQuery } from '@tanstack/react-query'
 *
 * // Use in a hook
 * const queryOptions = getNotificationQueryOptions({ apiClient })
 * const { data } = useQuery(queryOptions)
 *
 * // Or inject into data source
 * const dataSource = createFetchNotificationDataSource({
 *   queryClient,
 *   queryOptions,
 * })
 * ```
 */
export function getNotificationQueryOptions(
  ctx: GetNotificationQueryOptionsContext,
): QueryOptionsResult<InAppNotification[], Error, InAppNotification[], [ReactQueryCacheKey.Notifications]> {
  const { apiClient, getPlatformType, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS, getIsSessionInitialized } = ctx

  return queryOptions({
    queryKey: [ReactQueryCacheKey.Notifications],
    queryFn: async (): Promise<InAppNotification[]> => {
      const isSessionInitialized = getIsSessionInitialized?.() ?? true

      if (getIsSessionInitialized && !isSessionInitialized) {
        return []
      }

      try {
        const platformType = getPlatformType()
        const response = await apiClient.getNotifications({ platform_type: platformType })
        // Convert protobuf Messages to plain objects for React Query caching
        // toPlainMessage strips the Message prototype chain and preserves numeric enum values
        // It's schema-aware and automatically handles nested messages, making it resilient to schema changes
        const serialized: InAppNotification[] = response.notifications.map((notification) =>
          toPlainMessage(notification),
        )
        return serialized
      } catch (error) {
        getLogger().error(error, {
          tags: { file: 'notificationQueryOptions', function: 'queryFn' },
        })
        throw error
      }
    },
    refetchInterval: getIsSessionInitialized
      ? (): number => {
          const isInit = getIsSessionInitialized()
          // Poll faster (2s) when waiting for session, normal interval once initialized
          return isInit ? pollIntervalMs : 2000
        }
      : (): number => pollIntervalMs,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    // Use short staleTime when session check is enabled - allows faster refetches when session becomes ready
    // Without this, empty results from pre-session fetches would be cached too long
    staleTime: getIsSessionInitialized ? 1000 : pollIntervalMs - 1000,
    retry: 2,
    retryDelay: (attemptIndex: number): number => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
