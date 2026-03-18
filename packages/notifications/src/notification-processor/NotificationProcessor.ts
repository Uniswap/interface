import { type InAppNotification } from '@universe/api'

/**
 * Result of processing notifications, separating primary notifications
 * from chained notifications that should be shown later
 */
export interface NotificationProcessorResult {
  /**
   * Primary notifications that should be rendered immediately
   */
  primary: InAppNotification[]

  /**
   * Chained notifications that should be stored for later triggering
   */
  chained: Map<string, InAppNotification>
}

export interface NotificationProcessor {
  /**
   * Process incoming notifications against current state
   * Separates primary notifications (to be shown immediately) from chained notifications
   * (to be shown when triggered by another notification's POPUP action)
   */
  process(notifications: InAppNotification[]): Promise<NotificationProcessorResult>
}
