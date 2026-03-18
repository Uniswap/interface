import { type InAppNotification } from '@universe/api'
import { createNotificationDataSource } from '@universe/notifications/src/notification-data-source/implementations/createNotificationDataSource'
import { type NotificationDataSource } from '@universe/notifications/src/notification-data-source/NotificationDataSource'
import { type NotificationTracker } from '@universe/notifications/src/notification-tracker/NotificationTracker'
import { getLogger } from 'utilities/src/logger/logger'

/**
 * Configuration for a single trigger condition.
 * Each trigger represents a local notification that should be shown when conditions are met.
 */
export interface TriggerCondition {
  /**
   * Unique ID for this notification.
   * Must use 'local:' prefix to distinguish from backend-generated notifications
   * and prevent API tracker from trying to acknowledge them server-side.
   */
  id: string

  /**
   * Check if the notification should be shown now.
   * Called on each poll interval.
   */
  shouldShow: () => boolean | Promise<boolean>

  /**
   * Create the notification object to be rendered.
   * Only called when shouldShow returns true.
   */
  createNotification: () => InAppNotification

  /**
   * Optional callback when user acknowledges the notification.
   * Use this to update Redux state or perform other side effects.
   */
  onAcknowledge?: () => void
}

export interface CreateLocalTriggerDataSourceContext {
  /** Array of trigger conditions to evaluate */
  triggers: TriggerCondition[]

  /** Tracker for checking/storing processed state */
  tracker: NotificationTracker

  /** How often to check triggers in milliseconds (default: 5000ms) */
  pollIntervalMs?: number

  /** Source identifier for telemetry */
  source?: string

  /** File tag for logging */
  logFileTag?: string
}

const DEFAULT_POLL_INTERVAL_MS = 5000
const DEFAULT_SOURCE = 'local_triggers'
const DEFAULT_LOG_FILE_TAG = 'createLocalTriggerDataSource'

/**
 * Creates a data source for condition-based local notifications.
 *
 * Unlike API-based data sources, this polls local state (e.g., Redux selectors)
 * to determine when to show notifications. Useful for modals that should auto-open
 * based on user state or behavior (e.g., app rating prompts, backup reminders).
 *
 * @example
 * ```typescript
 * const localTriggers = createLocalTriggerDataSource({
 *   triggers: [
 *     {
 *       id: 'local:app_rating',
 *       shouldShow: () => appRatingSelector(getState()).shouldPrompt,
 *       createNotification: () => createAppRatingNotification(),
 *       onAcknowledge: () => dispatch(setAppRating({})),
 *     },
 *   ],
 *   tracker,
 *   pollIntervalMs: 5000,
 * })
 * ```
 */
export function createLocalTriggerDataSource(ctx: CreateLocalTriggerDataSourceContext): NotificationDataSource {
  const {
    triggers,
    tracker,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    source = DEFAULT_SOURCE,
    logFileTag = DEFAULT_LOG_FILE_TAG,
  } = ctx

  let intervalId: ReturnType<typeof setInterval> | null = null
  let currentCallback: ((notifications: InAppNotification[], source: string) => void) | null = null

  const checkTriggers = async (): Promise<InAppNotification[]> => {
    const notifications: InAppNotification[] = []

    for (const trigger of triggers) {
      try {
        // Skip if already processed
        const isProcessed = await tracker.isProcessed(trigger.id)
        if (isProcessed) {
          continue
        }

        // Check if trigger condition is met
        const shouldShow = await Promise.resolve(trigger.shouldShow())
        if (shouldShow) {
          notifications.push(trigger.createNotification())
        }
      } catch (error) {
        getLogger().error(error, {
          tags: { file: logFileTag, function: 'checkTriggers' },
          extra: { triggerId: trigger.id },
        })
      }
    }

    return notifications
  }

  const pollAndEmit = async (logFunctionTag: string): Promise<void> => {
    if (!currentCallback) {
      return
    }

    try {
      const notifications = await checkTriggers()
      currentCallback(notifications, source)
    } catch (error) {
      getLogger().error(error, {
        tags: { file: logFileTag, function: logFunctionTag },
      })
    }
  }

  const start = (onNotifications: (notifications: InAppNotification[], source: string) => void): void => {
    if (intervalId) {
      return
    }

    currentCallback = onNotifications

    // Check immediately on start
    pollAndEmit('start').catch((error) => {
      getLogger().error(error, {
        tags: { file: logFileTag, function: 'start' },
      })
    })

    // Then poll at interval
    intervalId = setInterval(() => {
      pollAndEmit('setInterval').catch((error) => {
        getLogger().error(error, {
          tags: { file: logFileTag, function: 'setInterval' },
        })
      })
    }, pollIntervalMs)
  }

  const stop = async (): Promise<void> => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    currentCallback = null
  }

  return createNotificationDataSource({ start, stop })
}

/**
 * Get a trigger by notification ID.
 * Useful for finding the trigger's callbacks when a notification is interacted with.
 */
export function getTriggerById(triggers: TriggerCondition[], notificationId: string): TriggerCondition | undefined {
  return triggers.find((t) => t.id === notificationId)
}
