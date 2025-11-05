import { createNotificationTracker } from '@universe/notifications/src/notification-tracker/implementations/createNotificationTracker'
import {
  NotificationTracker,
  TrackingMetadata,
} from '@universe/notifications/src/notification-tracker/NotificationTracker'

/**
 * Creates a no-op notification tracker that doesn't persist any state.
 *
 * Since the backend will only send each notification to a user once in Phase 1,
 * client-side tracking is not needed. This implementation satisfies the
 * NotificationTracker interface without performing any actual tracking.
 *
 * Example usage:
 * ```typescript
 * import { createNoopNotificationTracker } from '@universe/notifications'
 *
 * const tracker = createNoopNotificationTracker()
 *
 * // All operations are no-ops
 * const processed = await tracker.isProcessed('notif-123') // always false
 * await tracker.track('notif-123', { timestamp: Date.now(), strategy: 'render' }) // no-op
 * ```
 */
export function createNoopNotificationTracker(): NotificationTracker {
  const isProcessed = async (_notificationId: string): Promise<boolean> => {
    return false
  }

  const getProcessedIds = async (): Promise<Set<string>> => {
    return new Set()
  }

  const track = async (_notificationId: string, _metadata: TrackingMetadata): Promise<void> => {
    // no-op
  }

  const cleanup = async (_olderThan: number): Promise<void> => {
    // no-op
  }

  return createNotificationTracker({
    isProcessed,
    getProcessedIds,
    track,
    cleanup,
  })
}
