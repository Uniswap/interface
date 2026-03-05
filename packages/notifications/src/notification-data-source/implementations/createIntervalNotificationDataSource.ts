import { type InAppNotification } from '@universe/api'
import { createNotificationDataSource } from '@universe/notifications/src/notification-data-source/implementations/createNotificationDataSource'
import { type NotificationDataSource } from '@universe/notifications/src/notification-data-source/NotificationDataSource'
import { getLogger } from 'utilities/src/logger/logger'

interface CreateIntervalNotificationDataSourceContext {
  pollIntervalMs: number
  source: string
  logFileTag: string
  getNotifications: () => Promise<InAppNotification[]>
}

/**
 * Helper for building interval-based notification data sources.
 * Handles start/stop lifecycle, immediate initial poll, and consistent error logging.
 */
export function createIntervalNotificationDataSource(
  ctx: CreateIntervalNotificationDataSourceContext,
): NotificationDataSource {
  const { pollIntervalMs, source, logFileTag, getNotifications } = ctx

  let intervalId: ReturnType<typeof setInterval> | null = null
  let currentCallback: ((notifications: InAppNotification[], source: string) => void) | null = null

  const pollAndEmit = async (logFunctionTag: string): Promise<void> => {
    if (!currentCallback) {
      return
    }

    try {
      const notifications = await getNotifications()
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
