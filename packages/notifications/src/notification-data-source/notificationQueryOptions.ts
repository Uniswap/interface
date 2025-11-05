import { queryOptions } from '@tanstack/react-query'
import type { InAppNotification, NotificationsApiClient } from '@universe/api'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const DEFAULT_POLL_INTERVAL_MS = 2 * ONE_MINUTE_MS

export interface GetNotificationQueryOptionsContext {
  apiClient: NotificationsApiClient
  pollIntervalMs?: number
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
  const { apiClient, pollIntervalMs = DEFAULT_POLL_INTERVAL_MS } = ctx

  return queryOptions({
    queryKey: [ReactQueryCacheKey.Notifications],
    queryFn: async (): Promise<InAppNotification[]> => {
      try {
        return await apiClient.getNotifications()
      } catch (error) {
        logger.error(error, {
          tags: { file: 'notificationQueryOptions', function: 'queryFn' },
        })
        throw error
      }
    },
    refetchInterval: pollIntervalMs,
    refetchIntervalInBackground: true,
    staleTime: pollIntervalMs - 1000,
    retry: 2,
    retryDelay: (attemptIndex: number): number => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
