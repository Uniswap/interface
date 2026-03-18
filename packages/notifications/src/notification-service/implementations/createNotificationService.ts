import { type InAppNotification, OnClickAction } from '@universe/api'
import {
  type NotificationClickTarget,
  type NotificationService,
  type NotificationServiceConfig,
} from '@universe/notifications/src/notification-service/NotificationService'
import ms from 'ms'
import { getLogger } from 'utilities/src/logger/logger'

// Module-level singletons to track notification telemetry across service recreations.
// This prevents duplicate telemetry events when the service is destroyed
// and recreated (e.g., during navigation in the extension sidebar).
const receivedNotifications = new Set<string>()
const shownNotifications = new Set<string>()

export function createNotificationService(config: NotificationServiceConfig): NotificationService {
  const { dataSources, tracker, processor, renderer, telemetry, onNavigate } = config

  const activeRenders = new Map<string, () => void>()
  const activeNotifications = new Map<string, InAppNotification>()
  const chainedNotifications = new Map<string, InAppNotification>()

  const CLEANUP_OLDER_THAN_MS = ms('30d') // Clean up entries older than 30 days

  /**
   * Renders a single notification if possible
   */
  function renderNotification(notification: InAppNotification): void {
    if (!renderer.canRender(notification)) {
      return
    }

    if (activeRenders.has(notification.id)) {
      return
    }

    const cleanup = renderer.render(notification)
    activeRenders.set(notification.id, cleanup)
    activeNotifications.set(notification.id, notification)
  }

  async function handleNotifications(notifications: InAppNotification[]): Promise<void> {
    const result = await processor.process(notifications)

    for (const [id, notification] of result.chained.entries()) {
      chainedNotifications.set(id, notification)
    }

    for (const notification of result.primary) {
      renderNotification(notification)
    }
  }

  /**
   * Get the onClick configuration for a notification based on what was clicked
   */
  function getOnClick(
    notification: InAppNotification,
    target: NotificationClickTarget,
  ): { onClick: OnClickAction[]; onClickLink?: string } | undefined {
    if (target.type === 'button') {
      const buttons = notification.content?.buttons ?? []
      if (target.index < 0 || target.index >= buttons.length) {
        getLogger().warn('NotificationService', 'getOnClick', `Invalid button index: ${target.index}`)
        return undefined
      }
      const button = buttons[target.index]

      if (button?.onClick) {
        return {
          onClick: button.onClick.onClick,
          onClickLink: button.onClick.onClickLink,
        }
      }
    }
    if (target.type === 'background') {
      const backgroundOnClick = notification.content?.background?.backgroundOnClick
      if (backgroundOnClick) {
        return {
          onClick: backgroundOnClick.onClick,
          onClickLink: backgroundOnClick.onClickLink,
        }
      }
    }
    if (target.type === 'dismiss') {
      // Check if notification specifies custom dismiss behavior
      const onDismissClick = notification.content?.onDismissClick
      if (onDismissClick) {
        return {
          onClick: onDismissClick.onClick,
          onClickLink: onDismissClick.onClickLink,
        }
      }
      // Fallback to simple DISMISS if not specified
      // The processor validates that notifications have DISMISS somewhere,
      // so this fallback should rarely be used
      return {
        onClick: [OnClickAction.DISMISS],
      }
    }
    return undefined
  }

  /**
   * Internal method to handle dismissing a notification
   * Cleans up the render without tracking (tracking only happens on ACK)
   */
  async function handleDismiss(notificationId: string): Promise<void> {
    const cleanup = activeRenders.get(notificationId)
    if (cleanup) {
      cleanup()
      activeRenders.delete(notificationId)
    }

    activeNotifications.delete(notificationId)
    shownNotifications.delete(notificationId)
  }

  /**
   * Gets all downstream notification IDs in the chain starting from a notification
   * Checks all possible click targets: buttons, background, and dismiss button
   *
   * @param notification - The notification object to start traversing from
   * @returns Array of downstream notification IDs
   */
  function getDownstreamNotificationIds(notification: InAppNotification): string[] {
    const visited = new Set<string>()
    const downstream: string[] = []

    function traverse(currentNotification: InAppNotification): void {
      if (visited.has(currentNotification.id)) {
        return
      }
      visited.add(currentNotification.id)

      // Extract popup targets from buttons
      const buttons = currentNotification.content?.buttons ?? []
      for (const button of buttons) {
        if (button.onClick?.onClick.includes(OnClickAction.POPUP) && button.onClick.onClickLink) {
          const targetId = button.onClick.onClickLink
          // Only add to downstream if the notification actually exists
          const nextNotification = activeNotifications.get(targetId) ?? chainedNotifications.get(targetId)
          if (nextNotification && !visited.has(targetId)) {
            downstream.push(targetId)
            traverse(nextNotification)
          }
        }
      }

      // Extract popup target from background click
      const backgroundOnClick = currentNotification.content?.background?.backgroundOnClick
      if (backgroundOnClick?.onClick.includes(OnClickAction.POPUP) && backgroundOnClick.onClickLink) {
        const targetId = backgroundOnClick.onClickLink
        // Only add to downstream if the notification actually exists
        const nextNotification = activeNotifications.get(targetId) ?? chainedNotifications.get(targetId)
        if (nextNotification && !visited.has(targetId)) {
          downstream.push(targetId)
          traverse(nextNotification)
        }
      }

      // Extract popup target from dismiss button click
      const onDismissClick = currentNotification.content?.onDismissClick
      if (onDismissClick?.onClick.includes(OnClickAction.POPUP) && onDismissClick.onClickLink) {
        const targetId = onDismissClick.onClickLink
        // Only add to downstream if the notification actually exists
        const nextNotification = activeNotifications.get(targetId) ?? chainedNotifications.get(targetId)
        if (nextNotification && !visited.has(targetId)) {
          downstream.push(targetId)
          traverse(nextNotification)
        }
      }
    }

    traverse(notification)
    return downstream
  }

  /**
   * Internal method to handle acknowledging a notification
   * Tracks the notification as acknowledged/processed, along with all downstream chained notifications
   *
   * @param notification - The notification object
   */
  async function handleAcknowledge(notification: InAppNotification): Promise<void> {
    const timestamp = Date.now()

    await tracker.track(notification.id, { timestamp })

    const downstreamIds = getDownstreamNotificationIds(notification)
    await Promise.all(downstreamIds.map(async (downstreamId) => tracker.track(downstreamId, { timestamp })))
  }

  return {
    async initialize(): Promise<void> {
      for (const dataSource of dataSources) {
        dataSource.start((notifications, source) => {
          for (const notification of notifications) {
            if (!receivedNotifications.has(notification.id)) {
              receivedNotifications.add(notification.id)
              telemetry?.onNotificationReceived({
                notificationId: notification.id,
                type: notification.content?.style,
                source,
                timestamp: Date.now(),
              })
            }
          }

          handleNotifications(notifications).catch((error) => {
            getLogger().error(error, {
              tags: {
                file: 'createNotificationService',
                function: 'handleNotifications',
              },
            })
          })
        })
      }

      // Clean up old tracked notifications on startup
      const cleanupThreshold = Date.now() - CLEANUP_OLDER_THAN_MS
      tracker.cleanup?.(cleanupThreshold).catch((error) => {
        getLogger().error(error, {
          tags: {
            file: 'createNotificationService',
            function: 'initialize',
          },
        })
      })
    },

    onRenderFailed(notificationId: string): void {
      // Clean up the failed render without marking as processed
      const cleanup = activeRenders.get(notificationId)
      if (cleanup) {
        cleanup()
        activeRenders.delete(notificationId)
      }

      activeNotifications.delete(notificationId)
      shownNotifications.delete(notificationId)
    },

    onNotificationClick(notificationId: string, target: NotificationClickTarget): void {
      const notification = activeNotifications.get(notificationId)
      if (!notification) {
        getLogger().warn('NotificationService', 'onNotificationClick', `Notification not found: ${notificationId}`)
        return
      }

      telemetry?.onNotificationInteracted({
        notificationId,
        type: notification.content?.style,
        action: target.type,
      })

      const onClickConfig = getOnClick(notification, target)
      if (!onClickConfig) {
        return
      }

      for (const action of onClickConfig.onClick) {
        switch (action) {
          case OnClickAction.EXTERNAL_LINK:
            if (onClickConfig.onClickLink) {
              if (onNavigate) {
                onNavigate(onClickConfig.onClickLink)
              } else {
                getLogger().warn(
                  'NotificationService',
                  'onNotificationClick',
                  'onNavigate handler not provided, cannot navigate to link',
                )
              }
            }
            break
          case OnClickAction.POPUP:
            if (onClickConfig.onClickLink) {
              const chainedNotification = chainedNotifications.get(onClickConfig.onClickLink)
              if (chainedNotification) {
                renderNotification(chainedNotification)
                chainedNotifications.delete(onClickConfig.onClickLink)
              }
            }
            break
          case OnClickAction.DISMISS:
            handleDismiss(notificationId).catch((error: unknown) => {
              getLogger().error(error, {
                tags: {
                  file: 'createNotificationService',
                  function: 'onNotificationClick',
                },
              })
            })
            break
          case OnClickAction.ACK:
            handleAcknowledge(notification).catch((error: unknown) => {
              getLogger().error(error, {
                tags: {
                  file: 'createNotificationService',
                  function: 'onNotificationClick',
                },
              })
            })
            break
          case OnClickAction.UNSPECIFIED:
            break
        }
      }
    },

    onNotificationShown(notificationId: string): void {
      if (shownNotifications.has(notificationId)) {
        return
      }

      const notification = activeNotifications.get(notificationId)
      if (!notification) {
        getLogger().warn('NotificationService', 'onNotificationShown', `Notification not found: ${notificationId}`)
        return
      }

      shownNotifications.add(notificationId)
      telemetry?.onNotificationShown({
        notificationId,
        type: notification.content?.style,
        timestamp: Date.now(),
      })
    },

    destroy(): void {
      // Clean up old tracked notifications on teardown
      const cleanupThreshold = Date.now() - CLEANUP_OLDER_THAN_MS
      tracker.cleanup?.(cleanupThreshold).catch((error) => {
        getLogger().error(error, {
          tags: {
            file: 'createNotificationService',
            function: 'destroy',
          },
        })
      })

      for (const dataSource of dataSources) {
        dataSource.stop().catch((error) => {
          getLogger().error(error, {
            tags: {
              file: 'createNotificationService',
              function: 'destroy',
            },
          })
        })
      }

      for (const cleanup of activeRenders.values()) {
        cleanup()
      }
      activeRenders.clear()
      // Note: receivedNotifications and shownNotifications are intentionally NOT cleared here.
      // They are module-level singletons that persist across service recreations
      // to prevent duplicate telemetry events.
    },
  }
}
