import { type NotificationDataSource } from '@universe/notifications/src/notification-data-source/NotificationDataSource'
import { type NotificationProcessor } from '@universe/notifications/src/notification-processor/NotificationProcessor'
import { type NotificationRenderer } from '@universe/notifications/src/notification-renderer/NotificationRenderer'
import { type NotificationTracker } from '@universe/notifications/src/notification-tracker/NotificationTracker'

export interface NotificationSystemConfig {
  // Multiple sources can feed notifications
  dataSources: NotificationDataSource[]
  tracker: NotificationTracker
  processor: NotificationProcessor
  renderer: NotificationRenderer
}

export interface NotificationSystem {
  // Initialize and start fetching notifications
  initialize(): Promise<void>
  // Mark notification as processed - called by the UI when dismissed
  onDismiss(notificationId: string): Promise<void>
  // Handle other actions
  onButtonClick(notificationId: string, button: string): void
  // Cleanup and teardown
  destroy(): void
}
