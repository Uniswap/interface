import { type QueryClient, type QueryKey, QueryObserver } from '@tanstack/react-query'
import { type InAppNotification } from '@universe/api'
import { createNotificationDataSource } from '@universe/notifications/src/notification-data-source/implementations/createNotificationDataSource'
import { type NotificationDataSource } from '@universe/notifications/src/notification-data-source/NotificationDataSource'
import { getLogger } from 'utilities/src/logger/logger'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

interface CreatePollingNotificationDataSourceContext<TQueryKey extends QueryKey = QueryKey> {
  queryClient: QueryClient
  queryOptions: QueryOptionsResult<InAppNotification[], Error, InAppNotification[], TQueryKey>
}

/**
 * Creates a polling notification data source using React Query.
 * This handles the lifecycle orchestration of the query (start/stop).
 */
export function createPollingNotificationDataSource<TQueryKey extends QueryKey = QueryKey>(
  ctx: CreatePollingNotificationDataSourceContext<TQueryKey>,
): NotificationDataSource {
  const { queryClient, queryOptions } = ctx

  let observer: QueryObserver<InAppNotification[], Error, InAppNotification[], InAppNotification[], TQueryKey> | null =
    null
  let unsubscribe: (() => void) | null = null
  let isActive = false

  const start = async (
    onNotifications: (notifications: InAppNotification[], source: string) => void,
  ): Promise<void> => {
    if (isActive) {
      return // Prevent multiple starts
    }

    isActive = true

    observer = new QueryObserver<InAppNotification[], Error, InAppNotification[], InAppNotification[], TQueryKey>(
      queryClient,
      queryOptions,
    )

    unsubscribe = observer.subscribe((result) => {
      // Only trigger callback when we have successful data
      // Check both result.data exists AND status is success to avoid partial states
      if (result.data && result.status === 'success') {
        onNotifications(result.data, 'polling_api')
      } else if (result.error) {
        getLogger().error(result.error, {
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

    observer = null

    try {
      await queryClient.cancelQueries({ queryKey: queryOptions.queryKey })
    } catch (error) {
      getLogger().error(error, {
        tags: { file: 'createPollingNotificationDataSource', function: 'stop' },
      })
    } finally {
      isActive = false
    }
  }

  return createNotificationDataSource({ start, stop })
}
