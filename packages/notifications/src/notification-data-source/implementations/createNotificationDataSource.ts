import { type InAppNotification } from '@universe/api'
import { type NotificationDataSource } from '@universe/notifications/src/notification-data-source/NotificationDataSource'

/**
 * Basic implementation of the NotificationDataSource interface.
 */
export function createNotificationDataSource(ctx: {
  start: (onNotifications: (notifications: InAppNotification[]) => void) => void
  stop: () => Promise<void>
}): NotificationDataSource {
  return {
    start: (onNotifications: (notifications: InAppNotification[]) => void): void => {
      ctx.start(onNotifications)
    },
    stop: async (): Promise<void> => {
      await ctx.stop()
    },
  }
}
