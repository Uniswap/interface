import { type InAppNotification } from '@universe/api'
import { createNotificationDataSource } from '@universe/notifications/src/notification-data-source/implementations/createNotificationDataSource'
import { type NotificationDataSource } from '@universe/notifications/src/notification-data-source/NotificationDataSource'
import { type ReactiveCondition } from '@universe/notifications/src/notification-data-source/types/ReactiveCondition'
import { type NotificationTracker } from '@universe/notifications/src/notification-tracker/NotificationTracker'
import { getLogger } from 'utilities/src/logger/logger'

export interface CreateReactiveDataSourceContext<TState> {
  /** The reactive condition that determines when to show the notification */
  condition: ReactiveCondition<TState>

  /** Tracker for checking/storing processed state */
  tracker: NotificationTracker

  /** Source identifier for telemetry (default: 'reactive') */
  source?: string

  /** File tag for logging (default: 'createReactiveDataSource') */
  logFileTag?: string
}

const DEFAULT_SOURCE = 'reactive'
const DEFAULT_LOG_FILE_TAG = 'createReactiveDataSource'

/**
 * Creates a data source for reactive, state-driven notifications.
 *
 * Unlike polling-based data sources, this subscribes to state changes and
 * immediately re-evaluates whether to show/hide the notification. The notification
 * is emitted when shouldShow returns true and removed when it returns false.
 *
 * Key behaviors:
 * - Subscribes to condition's state changes on start()
 * - When state changes, checks shouldShow(state)
 * - Emits [notification] when shouldShow is true and not already processed
 * - Emits [] when shouldShow is false (hides the notification)
 * - Checks tracker.isProcessed to prevent showing dismissed notifications
 *
 * @example
 * ```typescript
 * const offlineDataSource = createReactiveDataSource({
 *   condition: createOfflineCondition({ getState }),
 *   tracker,
 * })
 *
 * notificationService.registerDataSource(offlineDataSource)
 * ```
 */
export function createReactiveDataSource<TState>(ctx: CreateReactiveDataSourceContext<TState>): NotificationDataSource {
  const { condition, tracker, source = DEFAULT_SOURCE, logFileTag = DEFAULT_LOG_FILE_TAG } = ctx

  let unsubscribe: (() => void) | null = null
  let currentCallback: ((notifications: InAppNotification[], source: string) => void) | null = null

  const emitNotifications = async (state: TState): Promise<void> => {
    if (!currentCallback) {
      return
    }

    try {
      // Check if notification was already dismissed/processed
      const isProcessed = await tracker.isProcessed(condition.notificationId)
      if (isProcessed) {
        // Already dismissed, emit empty array
        currentCallback([], source)
        return
      }

      // Evaluate the condition
      const shouldShow = condition.shouldShow(state)

      if (shouldShow) {
        const notification = condition.createNotification(state)
        currentCallback([notification], source)
      } else {
        // Condition not met, emit empty array to hide
        currentCallback([], source)
      }
    } catch (error) {
      getLogger().error(error, {
        tags: { file: logFileTag, function: 'emitNotifications' },
        extra: { notificationId: condition.notificationId },
      })
    }
  }

  const start = (onNotifications: (notifications: InAppNotification[], source: string) => void): void => {
    if (unsubscribe) {
      return
    }

    currentCallback = onNotifications

    // Subscribe to state changes
    unsubscribe = condition.subscribe((state: TState) => {
      emitNotifications(state).catch((error) => {
        getLogger().error(error, {
          tags: { file: logFileTag, function: 'subscribe' },
        })
      })
    })
  }

  const stop = async (): Promise<void> => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    currentCallback = null
  }

  return createNotificationDataSource({ start, stop })
}
