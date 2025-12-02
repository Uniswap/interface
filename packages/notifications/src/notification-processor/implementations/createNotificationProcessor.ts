import { type InAppNotification } from '@universe/api'
import { type NotificationProcessor } from '@universe/notifications/src/notification-processor/NotificationProcessor'

export function createNotificationProcessor(ctx: {
  process: (notifications: InAppNotification[]) => Promise<InAppNotification[]>
}): NotificationProcessor {
  return {
    process: async (notifications: InAppNotification[]): Promise<InAppNotification[]> => {
      return ctx.process(notifications)
    },
  }
}
