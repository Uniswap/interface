import {
  createLocalTriggerDataSource,
  type TriggerCondition,
} from '@universe/notifications/src/notification-data-source/implementations/createLocalTriggerDataSource'
import { type NotificationDataSource } from '@universe/notifications/src/notification-data-source/NotificationDataSource'
import { type NotificationTracker } from '@universe/notifications/src/notification-tracker/NotificationTracker'
import { createAppRatingTrigger } from 'src/notification-service/triggers/appRatingTrigger'
import { type ExtensionState } from 'src/store/extensionReducer'
import { setAppRating } from 'wallet/src/features/wallet/slice'

/**
 * Context required to create the extension local trigger data source.
 */
interface CreateExtensionLocalTriggerDataSourceContext {
  /** Function to get the current Redux state */
  getState: () => ExtensionState
  /** Redux dispatch function */
  dispatch: (action: ReturnType<typeof setAppRating>) => void
  /** Notification tracker for checking processed state */
  tracker: NotificationTracker
  /** How often to check triggers in milliseconds (default: 5000ms) */
  pollIntervalMs?: number
}

/**
 * All trigger conditions for the extension.
 * Add new triggers here as they are migrated.
 */
function getExtensionTriggers(ctx: {
  getState: () => ExtensionState
  dispatch: (action: ReturnType<typeof setAppRating>) => void
}): TriggerCondition[] {
  return [
    createAppRatingTrigger(ctx),
    // Future triggers can be added here:
    // createSmartWalletCreatedTrigger(ctx),
    // createSmartWalletNudgeTrigger(ctx),
    // createSmartWalletEnabledTrigger(ctx),
  ]
}

/**
 * Creates a data source for all extension local trigger notifications.
 *
 * This combines all extension-specific triggers (app rating, smart wallet nudges, etc.)
 * into a single data source that can be added to the notification service.
 */
export function createExtensionLocalTriggerDataSource(
  ctx: CreateExtensionLocalTriggerDataSourceContext,
): NotificationDataSource {
  const { getState, dispatch, tracker, pollIntervalMs = 5000 } = ctx

  const triggers = getExtensionTriggers({ getState, dispatch })

  return createLocalTriggerDataSource({
    triggers,
    tracker,
    pollIntervalMs,
    source: 'extension_local_triggers',
    logFileTag: 'createExtensionLocalTriggerDataSource',
  })
}

/**
 * Check if a notification ID is a local trigger notification.
 * Local trigger notifications use the 'local:' prefix.
 */
export function isLocalTriggerNotification(notificationId: string): boolean {
  return notificationId.startsWith('local:')
}
