import {
  NotificationTracker,
  TrackingMetadata,
} from '@universe/notifications/src/notification-tracker/NotificationTracker'

/**
 * Basic implementation of the NotificationTracker interface.
 */
export function createNotificationTracker(ctx: {
  isProcessed: (notificationId: string) => Promise<boolean>
  getProcessedIds: () => Promise<Set<string>>
  track: (notificationId: string, metadata: TrackingMetadata) => Promise<void>
  cleanup?: (olderThan: number) => Promise<void>
}): NotificationTracker {
  return {
    isProcessed: async (notificationId: string): Promise<boolean> => {
      return ctx.isProcessed(notificationId)
    },
    getProcessedIds: async (): Promise<Set<string>> => {
      return ctx.getProcessedIds()
    },
    track: async (notificationId: string, metadata: TrackingMetadata): Promise<void> => {
      return ctx.track(notificationId, metadata)
    },
    cleanup: ctx.cleanup
      ? async (olderThan: number): Promise<void> => {
          return ctx.cleanup?.(olderThan)
        }
      : undefined,
  }
}
