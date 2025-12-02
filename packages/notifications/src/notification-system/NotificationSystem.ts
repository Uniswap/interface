import { type NotificationDataSource } from '@universe/notifications/src/notification-data-source/NotificationDataSource'
import { type NotificationProcessor } from '@universe/notifications/src/notification-processor/NotificationProcessor'
import { type NotificationRenderer } from '@universe/notifications/src/notification-renderer/NotificationRenderer'
import { type NotificationTelemetry } from '@universe/notifications/src/notification-telemetry/NotificationTelemetry'
import { type NotificationTracker } from '@universe/notifications/src/notification-tracker/NotificationTracker'

/**
 * Represents what was clicked on a notification
 */
export type NotificationClickTarget = { type: 'button'; index: number } | { type: 'background' } | { type: 'dismiss' }

export interface NotificationSystemConfig {
  // Multiple sources can feed notifications
  dataSources: NotificationDataSource[]
  tracker: NotificationTracker
  processor: NotificationProcessor
  renderer: NotificationRenderer
  telemetry?: NotificationTelemetry
  // Platform-specific handler for navigation/link clicks
  // Should handle both internal navigation (same-origin) and external links
  onNavigate?: (url: string) => void
}

export interface NotificationSystem {
  // Initialize and start fetching notifications
  initialize(): Promise<void>
  /**
   * Handle a render failure (e.g., unknown notification style)
   * Cleans up the render without marking the notification as processed,
   * allowing it to be re-rendered when correct data arrives
   */
  onRenderFailed(notificationId: string): void
  /**
   * Handle a click on a notification (button, background, dismiss, or acknowledge)
   * Executes all actions specified in the onClick array for the clicked target
   * @param notificationId - ID of the notification that was clicked
   * @param target - What was clicked (button, background, dismiss, or acknowledge)
   */
  onNotificationClick(notificationId: string, target: NotificationClickTarget): void
  // Cleanup and teardown
  destroy(): void
}
