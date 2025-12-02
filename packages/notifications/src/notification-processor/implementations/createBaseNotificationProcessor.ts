import { type InAppNotification } from '@universe/api'
import { createNotificationProcessor } from '@universe/notifications/src/notification-processor/implementations/createNotificationProcessor'
import { type NotificationProcessor } from '@universe/notifications/src/notification-processor/NotificationProcessor'
import { type NotificationTracker } from '@universe/notifications/src/notification-tracker/NotificationTracker'

/**
 * Creates a base notification processor that implements style-based deduplication and ordering.
 *
 * Processing rules:
 * 1. Filters out notifications that have already been processed (tracked)
 * 2. Sorts remaining notifications chronologically (by timestamp)
 * 3. Filter "sub" notifications and separate them from the "main" notifications
 * @param tracker - The NotificationTracker to check which notifications have been processed
 * @returns A NotificationProcessor that applies these rules
 */
export function createBaseNotificationProcessor(tracker: NotificationTracker): NotificationProcessor {
  return createNotificationProcessor({
    process: async (notifications: InAppNotification[]): Promise<InAppNotification[]> => {
      // Step 1: Get processed IDs from the tracker
      const processedIds = await tracker.getProcessedIds()

      // Step 2: Filter out notifications that are locally tracked
      const filtered = notifications.filter((notification) => !processedIds.has(notification.id))

      // Step 3: Sort chronologically by timestamp (oldest first)
      // Notifications without timestamp will be treated as 0 (oldest)
      const sorted = [...filtered].sort((a, b) => {
        const timeA = a.timestamp ?? 0
        const timeB = b.timestamp ?? 0
        return timeA - timeB
      })

      // Step 4: Filter "sub" notifications and separate them from the "main" notifications
      // TODO

      return sorted
    },
  })
}
