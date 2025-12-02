import type { FetchQueryOptions, QueryClient } from '@tanstack/react-query'
import type { NotificationsApiClient } from '@universe/api'
import { createNotificationTracker } from '@universe/notifications/src/notification-tracker/implementations/createNotificationTracker'
import {
  NotificationTracker,
  TrackingMetadata,
} from '@universe/notifications/src/notification-tracker/NotificationTracker'
import { getLogger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

/**
 * Context for creating an API-based notification tracker
 */
export interface ApiNotificationTrackerContext {
  notificationsApiClient: NotificationsApiClient
  queryClient: QueryClient
  /**
   * Optional local storage for tracking state (e.g., to avoid duplicate API calls)
   * If not provided, the tracker will always call the API
   */
  storage: {
    has: (notificationId: string) => Promise<boolean>
    add: (notificationId: string, metadata?: { timestamp: number }) => Promise<void>
    getAll: () => Promise<Set<string>>
    deleteOlderThan: (timestamp: number) => Promise<void>
  }
}

/**
 * Creates a notification tracker that uses the backend API to mark notifications as tracked.
 *
 * This implementation calls the AckNotifications API endpoint when a notification is tracked,
 * allowing the backend to record that the user has seen/interacted with the notification.
 *
 * Example usage:
 * ```typescript
 * import { createApiNotificationTracker } from '@universe/notifications'
 * import { createNotificationsApiClient } from '@universe/api'
 *
 * const apiClient = createNotificationsApiClient({
 *   fetchClient: myFetchClient,
 *   getApiPathPrefix: () => '/notifications/v1'
 * })
 *
 * const tracker = createApiNotificationTracker({
 *   notificationsApiClient: apiClient,
 *   queryClient: myQueryClient
 * })
 *
 * // Track a notification (sends request to backend with automatic retries)
 * await tracker.track('notif-123', {
 *   timestamp: Date.now()
 * })
 * ```
 */
export function createApiNotificationTracker(ctx: ApiNotificationTrackerContext): NotificationTracker {
  const { notificationsApiClient, queryClient, storage } = ctx

  // Track in-flight acknowledgments to prevent race conditions
  // If a notification is being acknowledged but storage write hasn't completed yet,
  // this ensures isProcessed() returns true immediately to prevent re-appearing notifications
  const pendingAcks = new Set<string>()

  const ackNotificationOptions = (notificationId: string): FetchQueryOptions => ({
    queryKey: [ReactQueryCacheKey.AckNotification, notificationId],
    queryFn: () =>
      notificationsApiClient.ackNotification({
        ids: [notificationId],
      }),
    // Retry up to 3 times for network errors or 5xx server errors
    retry: 3,
    // Exponential backoff: 1s, 2s, 4s, capped at 30s
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Don't cache the result - this is a write operation
    gcTime: 0,
  })

  const isProcessed = async (notificationId: string): Promise<boolean> => {
    if (pendingAcks.has(notificationId)) {
      return true
    }
    return storage.has(notificationId)
  }

  const getProcessedIds = async (): Promise<Set<string>> => {
    return storage.getAll()
  }

  const track = async (notificationId: string, metadata: TrackingMetadata): Promise<void> => {
    // Immediately mark as pending (synchronous) to prevent race condition
    // where data source refetches before storage write completes
    pendingAcks.add(notificationId)

    // Check if this is a local-only notification (client-defined, not from backend)
    const isLocalNotification = notificationId.startsWith('local:')

    // Attempt to call the backend API to acknowledge the notification
    try {
      await Promise.all([
        // Skip API call for local notifications since the backend has no knowledge of them
        isLocalNotification ? Promise.resolve() : queryClient.fetchQuery(ackNotificationOptions(notificationId)),
        // Even if API fails, update localStorage so the notification stays dismissed
        // from the user's perspective. This prioritizes UX over perfect backend consistency.
        //
        // Tradeoff: If localStorage is later cleared but the backend never received the ack,
        // the notification could reappear. However, by the time localStorage is cleaned up
        // or cleared, the notification will typically be expired on the backend anyway.
        storage
          .add(notificationId, { timestamp: metadata.timestamp })
          .catch((storageError) => {
            getLogger().error(
              `Storage write failed for notification ${notificationId}: ${storageError instanceof Error ? storageError.message : String(storageError)}`,
              {
                tags: { file: 'createApiNotificationTracker', function: 'track' },
              },
            )
          }),
      ])
    } catch (error) {
      getLogger().error(
        `Failed to acknowledge notification ${notificationId} after retries: ${error instanceof Error ? error.message : String(error)}`,
        {
          tags: {
            file: 'createApiNotificationTracker',
            function: 'track',
          },
        },
      )
      // Keep notification in pendingAcks even on error - prioritize UX
      // The user dismissed it, so it should stay dismissed from their perspective
    }
    // Note: We intentionally don't remove from pendingAcks after completion
    // Once acknowledged, it should always be considered processed
  }

  const cleanup = async (olderThan: number): Promise<void> => {
    await storage.deleteOlderThan(olderThan)
  }

  return createNotificationTracker({
    isProcessed,
    getProcessedIds,
    track,
    cleanup,
  })
}
