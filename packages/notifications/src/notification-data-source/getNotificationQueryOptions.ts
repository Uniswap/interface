import { toPlainMessage } from '@bufbuild/protobuf'
import { queryOptions } from '@tanstack/react-query'
import type { InAppNotification, NotificationsApiClient } from '@universe/api'
import { getLogger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const DEFAULT_POLL_INTERVAL_MS = 2 * ONE_MINUTE_MS

interface GetNotificationQueryOptionsContext {
  apiClient: NotificationsApiClient
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
  const { apiClient, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS, getIsSessionInitialized } = ctx

  return queryOptions({
    queryKey: [ReactQueryCacheKey.Notifications],
    queryFn: async (): Promise<InAppNotification[]> => {
      if (getIsSessionInitialized && !getIsSessionInitialized()) {
        return []
      }

      try {
        const response = await apiClient.getNotifications()
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
      ? (): number => (getIsSessionInitialized() ? pollIntervalMs : 5000)
      : (): number => pollIntervalMs,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    staleTime: pollIntervalMs - 1000,
    retry: 2,
    retryDelay: (attemptIndex: number): number => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
