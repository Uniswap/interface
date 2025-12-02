import { type NotificationTelemetry } from '@universe/notifications/src/notification-telemetry/NotificationTelemetry'

/**
 * Basic implementation of the NotificationTelemetry interface.
 * This factory function allows callsites to inject their own telemetry implementations.
 */
export function createNotificationTelemetry(ctx: {
  onNotificationReceived: (params: { notificationId: string; type: string; source: string; timestamp: number }) => void
  onNotificationShown: (params: { notificationId: string; type: string; timestamp: number }) => void
  onNotificationDismissed: (params: { notificationId: string; type: string }) => void
  onNotificationInteracted: (params: { notificationId: string; type: string; action: string }) => void
}): NotificationTelemetry {
  return {
    onNotificationReceived: (params): void => {
      ctx.onNotificationReceived(params)
    },
    onNotificationShown: (params): void => {
      ctx.onNotificationShown(params)
    },
    onNotificationDismissed: (params): void => {
      ctx.onNotificationDismissed(params)
    },
    onNotificationInteracted: (params): void => {
      ctx.onNotificationInteracted(params)
    },
  }
}
