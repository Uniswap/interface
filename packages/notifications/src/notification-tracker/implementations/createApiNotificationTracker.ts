import type { NotificationsApiClient } from '@universe/api'
import { createNotificationTracker } from '@universe/notifications/src/notification-tracker/implementations/createNotificationTracker'
import {
  NotificationTracker,
  TrackingMetadata,
} from '@universe/notifications/src/notification-tracker/NotificationTracker'
import { getLogger } from 'utilities/src/logger/logger'

/**
 * Context for creating an API-based notification tracker
 */
export interface ApiNotificationTrackerContext {
  notificationsApiClient: NotificationsApiClient
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
 *   queryClient: myQueryClient,
 *   getApiPathPrefix: () => '/notifications/v1'
 * })
 *
 * const tracker = createApiNotificationTracker({
 *   notificationsApiClient: apiClient
 * })
 *
 * // Track a notification (sends request to backend with automatic retries)
 * await tracker.track('notif-123', {
 *   timestamp: Date.now()
 * })
 * ```
 */
export function createApiNotificationTracker(ctx: ApiNotificationTrackerContext): NotificationTracker {
  const { notificationsApiClient, storage } = ctx

  const isProcessed = async (notificationId: string): Promise<boolean> => {
    return storage.has(notificationId)
  }

  const getProcessedIds = async (): Promise<Set<string>> => {
    return storage.getAll()
  }

  const track = async (notificationId: string, metadata: TrackingMetadata): Promise<void> => {
    // Attempt to call the backend API to acknowledge the notification
    try {
      await notificationsApiClient.ackNotification({
        ids: [notificationId],
      })
    } catch (error) {
      getLogger().error(
        `Failed to acknowledge notification ${notificationId}: ${error instanceof Error ? error.message : String(error)}`,
        {
          tags: {
            file: 'createApiNotificationTracker',
            function: 'track',
          },
        },
      )
    }

    // Even if API fails, update localStorage so the notification stays dismissed
    // from the user's perspective. This prioritizes UX over perfect backend consistency.
    //
    // Tradeoff: If localStorage is later cleared but the backend never received the ack,
    // the notification could reappear. However, by the time localStorage is cleaned up
    // or cleared, the notification will typically be expired on the backend anyway.
    //
    // Future enhancement: Consider adding a multi-session retry queue to sync failed acks.
    // This would provide both good UX and eventual consistency.
    await storage.add(notificationId, { timestamp: metadata.timestamp })
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
