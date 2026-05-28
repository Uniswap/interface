import { ContentStyle, type InAppNotification } from '@universe/api'
import { createNotificationRenderer, type NotificationRenderer } from '@universe/notifications'
import { type NotificationState } from 'src/notification-service/notification-renderer/notificationStore'
import { type StoreApi, type UseBoundStore } from 'zustand'

interface CreateExtensionNotificationRendererContext {
  store: UseBoundStore<StoreApi<NotificationState>>
}

/**
 * Creates an extension-specific NotificationRenderer that uses Zustand store.
 * This renderer coordinates rendering for all notification types in the extension.
 */
export function createExtensionNotificationRenderer(
  ctx: CreateExtensionNotificationRendererContext,
): NotificationRenderer {
  const store = ctx.store

  return createNotificationRenderer({
    render: (notification: InAppNotification): (() => void) => {
      // Add notification to the store, which will trigger React to render it
      store.getState().addNotification(notification)

      // Return cleanup function that removes the notification from the store
      return (): void => {
        store.getState().removeNotification(notification.id)
      }
    },

    canRender: (notification: InAppNotification): boolean => {
      const { activeNotifications } = store.getState()
      const style = notification.content?.style

      // Only one modal at a time
      if (style === ContentStyle.MODAL) {
        const hasActiveModal = activeNotifications.some((n) => n.content?.style === ContentStyle.MODAL)
        return !hasActiveModal
      }

      // Other notification types can be rendered concurrently (up to limits defined in the processor)
      return true
    },
  })
}
