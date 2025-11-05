import { type InAppNotification } from '@universe/api'
import {
  type NotificationSystem,
  type NotificationSystemConfig,
} from '@universe/notifications/src/notification-system/NotificationSystem'
import { getLogger } from 'utilities/src/logger/logger'

export function createNotificationSystem(config: NotificationSystemConfig): NotificationSystem {
  const { dataSources, tracker, processor, renderer } = config

  const activeRenders = new Map<string, () => void>()

  const processedIds: Set<string> = new Set()

  async function handleNotifications(notifications: InAppNotification[]): Promise<void> {
    const notificationsToRender = await processor.process(notifications)

    for (const notification of notificationsToRender) {
      if (!renderer.canRender(notification)) {
        continue
      }

      if (activeRenders.has(notification.id)) {
        continue
      }

      const cleanup = renderer.render(notification)
      activeRenders.set(notification.id, cleanup)

      // TODO: send onRender analytics event

      processedIds.add(notification.id)
    }
  }

  return {
    async initialize(): Promise<void> {
      for (const dataSource of dataSources) {
        dataSource.start((notifications) => {
          // TODO: send onNotificationReceived analytics event
          handleNotifications(notifications).catch((error) => {
            getLogger().error(error, {
              tags: {
                file: 'createNotificationSystem',
                function: 'handleNotifications',
              },
            })
          })
        })
      }
    },

    async onDismiss(notificationId: string): Promise<void> {
      await tracker.track(notificationId, {
        timestamp: Date.now(),
        strategy: 'dismiss',
      })

      // TODO: send onDismiss analytics event

      const cleanup = activeRenders.get(notificationId)
      if (cleanup) {
        cleanup()
        activeRenders.delete(notificationId)
      }

      // Add to processed IDs if not already there
      processedIds.add(notificationId)
    },

    onButtonClick(_notificationId: string, _button: string): void {
      // TODO: send onButtonClick analytics event
      // TODO: handle button click (e.g. trigger next notification)
    },

    destroy(): void {
      // Stop all data sources
      for (const dataSource of dataSources) {
        dataSource.stop().catch((error) => {
          getLogger().error(error, {
            tags: {
              file: 'createNotificationSystem',
              function: 'destroy',
            },
          })
        })
      }

      // Clean up all active renders
      for (const cleanup of activeRenders.values()) {
        cleanup()
      }
      activeRenders.clear()
    },
  }
}
