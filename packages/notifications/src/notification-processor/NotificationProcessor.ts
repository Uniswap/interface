import { type InAppNotification } from '@universe/api'

export interface NotificationProcessor {
  // Process incoming notifications against current state
  // Returns only notifications that should be rendered
  process(notifications: InAppNotification[]): Promise<InAppNotification[]>
}
