import { type QueryClient, type QueryKey, QueryObserver } from '@tanstack/react-query'
import { type InAppNotification } from '@universe/api'
import { createNotificationDataSource } from '@universe/notifications/src/notification-data-source/implementations/createNotificationDataSource'
import { type NotificationDataSource } from '@universe/notifications/src/notification-data-source/NotificationDataSource'
import { logger } from 'utilities/src/logger/logger'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

export interface CreatePollingNotificationDataSourceContext<TQueryKey extends QueryKey = QueryKey> {
  queryClient: QueryClient
  queryOptions: QueryOptionsResult<InAppNotification[], Error, InAppNotification[], TQueryKey>
}

/**
 * Creates a polling notification data source using React Query.
 * This handles the lifecycle orchestration of the query (start/stop).
 *
 * Example usage:
 * ```typescript
 * import { createPollingNotificationDataSource, getNotificationQueryOptions } from '@universe/notifications'
 *
 * const queryOptions = getNotificationQueryOptions({
 *   apiClient: myNotificationsApiClient,
 *   pollIntervalMs: 120000, // Optional: 2 minutes
 * })
 *
 * const queryClient = useQueryClient()
 *
 * const dataSource = createPollingNotificationDataSource({
 *   queryClient: SharedQueryClient,
 *   queryOptions,
 * })
 *
 * // Start polling and handle notifications
 * dataSource.start((notifications) => {
 *   console.log('Received notifications:', notifications)
 * })
 *
 * // Stop polling and cleanup
 * dataSource.stop()
 * ```
 */
export function createPollingNotificationDataSource<TQueryKey extends QueryKey = QueryKey>(
  ctx: CreatePollingNotificationDataSourceContext<TQueryKey>,
): NotificationDataSource {
  const { queryClient, queryOptions } = ctx

  let unsubscribe: (() => void) | null = null
  let isActive = false

  const start = (onNotifications: (notifications: InAppNotification[]) => void): void => {
    if (isActive) {
      return // Prevent multiple starts
    }

    isActive = true

    const observer = new QueryObserver<InAppNotification[], Error, InAppNotification[], InAppNotification[], TQueryKey>(
      queryClient,
      queryOptions,
    )

    unsubscribe = observer.subscribe((result) => {
      if (result.data) {
        onNotifications(result.data)
      } else if (result.error) {
        logger.error(result.error, {
          tags: { file: 'createPollingNotificationDataSource', function: 'subscribe' },
        })
      }
    })
  }

  const stop = async (): Promise<void> => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }

    try {
      await queryClient.cancelQueries({ queryKey: queryOptions.queryKey })
    } catch (error) {
      logger.error(error, {
        tags: { file: 'createPollingNotificationDataSource', function: 'stop' },
      })
    } finally {
      isActive = false
    }
  }

  return createNotificationDataSource({ start, stop })
}
