import {
  createLocalTriggerDataSource,
  type TriggerCondition,
} from '@universe/notifications/src/notification-data-source/implementations/createLocalTriggerDataSource'
import { type NotificationDataSource } from '@universe/notifications/src/notification-data-source/NotificationDataSource'
import { type NotificationTracker } from '@universe/notifications/src/notification-tracker/NotificationTracker'
import { type MobileState } from 'src/app/mobileReducer'
import { createBackupReminderTrigger } from 'src/notification-service/triggers/backupReminderTrigger'
import { setBackupReminderLastSeenTs } from 'wallet/src/features/behaviorHistory/slice'

/**
 * Context required to create the mobile local trigger data source.
 */
interface CreateMobileLocalTriggerDataSourceContext {
  /** Function to get the current Redux state */
  getState: () => MobileState
  /** Redux dispatch function */
  dispatch: (action: ReturnType<typeof setBackupReminderLastSeenTs>) => void
  /** Notification tracker for checking processed state */
  tracker: NotificationTracker
  /** Function to get current portfolio value in USD for the active account */
  getPortfolioValue: () => Promise<number>
  /** How often to check triggers in milliseconds (default: 5000ms) */
  pollIntervalMs?: number
}

/**
 * All trigger conditions for mobile.
 * Add new triggers here as they are migrated.
 */
function getMobileTriggers(ctx: {
  getState: () => MobileState
  dispatch: (action: ReturnType<typeof setBackupReminderLastSeenTs>) => void
  getPortfolioValue: () => Promise<number>
}): TriggerCondition[] {
  return [
    createBackupReminderTrigger(ctx),
    // Future triggers can be added here:
    // createAppRatingTrigger(ctx),
    // etc.
  ]
}

/**
 * Creates a data source for all mobile local trigger notifications.
 *
 * This combines all mobile-specific triggers (backup reminder, etc.)
 * into a single data source that can be added to the notification service.
 */
export function createMobileLocalTriggerDataSource(
  ctx: CreateMobileLocalTriggerDataSourceContext,
): NotificationDataSource {
  const { getState, dispatch, tracker, getPortfolioValue, pollIntervalMs = 5000 } = ctx

  const triggers = getMobileTriggers({ getState, dispatch, getPortfolioValue })

  return createLocalTriggerDataSource({
    triggers,
    tracker,
    pollIntervalMs,
    source: 'mobile_local_triggers',
    logFileTag: 'createMobileLocalTriggerDataSource',
  })
}

/**
 * Check if a notification ID is a local trigger notification.
 * Local trigger notifications use the 'local:' prefix.
 */
export function isLocalTriggerNotification(notificationId: string): boolean {
  return notificationId.startsWith('local:')
}
