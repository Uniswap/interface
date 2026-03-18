import { type ContentStyle } from '@universe/api'

/**
 * Telemetry interface for tracking notification lifecycle events
 * This interface is injected by the callsite (e.g. web) to allow
 * platform-specific analytics implementations without coupling
 * the notification system to any specific analytics provider.
 */
export interface NotificationTelemetry {
  /**
   * Called when a notification is fetched and processed from a data source
   */
  onNotificationReceived(params: {
    notificationId: string
    type: ContentStyle | undefined
    source: string // 'backend' | 'websocket' | 'legacy'
    timestamp: number
  }): void

  /**
   * Called when a notification is rendered to the user
   */
  onNotificationShown(params: { notificationId: string; type: ContentStyle | undefined; timestamp: number }): void

  /**
   * Called when a user interacts with a notification (clicks, etc.)
   */
  onNotificationInteracted(params: {
    notificationId: string
    type: ContentStyle | undefined
    action: string // 'button' | 'background' | 'dismiss'
  }): void
}

/**
 * No-op implementation for testing or when telemetry is disabled
 */
export function createNoopNotificationTelemetry(): NotificationTelemetry {
  return {
    onNotificationReceived: (): void => {},
    onNotificationShown: (): void => {},
    onNotificationInteracted: (): void => {},
  }
}
