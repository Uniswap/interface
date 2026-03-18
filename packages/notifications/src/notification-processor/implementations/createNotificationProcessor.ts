import { type InAppNotification } from '@universe/api'
import {
  type NotificationProcessor,
  type NotificationProcessorResult,
} from '@universe/notifications/src/notification-processor/NotificationProcessor'

export function createNotificationProcessor(ctx: {
  process: (notifications: InAppNotification[]) => Promise<NotificationProcessorResult>
}): NotificationProcessor {
  return {
    process: async (notifications: InAppNotification[]): Promise<NotificationProcessorResult> => {
      return ctx.process(notifications)
    },
  }
}
