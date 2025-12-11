import { type NotificationTelemetry } from '@universe/notifications/src/notification-telemetry/NotificationTelemetry'
import { formatNotificationType } from '@universe/notifications/src/utils/formatNotificationType'

/**
 * Basic implementation of the NotificationTelemetry interface.
 * This factory function allows callsites to inject their own telemetry implementations.
 */
export function createNotificationTelemetry(ctx: {
  onNotificationReceived: (params: { notificationId: string; type: string; source: string; timestamp: number }) => void
  onNotificationShown: (params: { notificationId: string; type: string; timestamp: number }) => void
  onNotificationInteracted: (params: { notificationId: string; type: string; action: string }) => void
}): NotificationTelemetry {
  return {
    onNotificationReceived: (params): void => {
      ctx.onNotificationReceived({
        ...params,
        type: formatNotificationType(params.type),
      })
    },
    onNotificationShown: (params): void => {
      ctx.onNotificationShown({
        ...params,
        type: formatNotificationType(params.type),
      })
    },
    onNotificationInteracted: (params): void => {
      ctx.onNotificationInteracted({
        ...params,
        type: formatNotificationType(params.type),
      })
    },
  }
}
