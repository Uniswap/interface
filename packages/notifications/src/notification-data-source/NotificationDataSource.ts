import { type InAppNotification } from '@universe/api'

export interface NotificationDataSource {
  // Start receiving notifications (implementation determines mechanism: fetch, websocket, polling, etc.)
  start(onNotifications: (notifications: InAppNotification[]) => void): void
  // Stop receiving notifications and cleanup
  stop(): Promise<void>
}
