/* eslint-disable import/no-unused-modules */
import { ContentStyle, type InAppNotification } from '@universe/api'
import { createNotificationRenderer, type NotificationRenderer } from '@universe/notifications'
import { type NotificationState } from 'notification-service/notification-renderer/notificationStore'
import { type StoreApi, type UseBoundStore } from 'zustand'

export interface CreateWebNotificationRendererContext {
  store: UseBoundStore<StoreApi<NotificationState>>
}

/**
 * Creates a web-specific NotificationRenderer that uses Zustand store.
 * This renderer coordinates rendering for all notification types in the web app.
 */
export function createWebNotificationRenderer(ctx: CreateWebNotificationRendererContext): NotificationRenderer {
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

      // Example rule that needs insight into current render state: only one modal at a time
      if (style === ContentStyle.MODAL) {
        const hasActiveModal = activeNotifications.some((n) => n.content?.style === ContentStyle.MODAL)
        return !hasActiveModal
      }

      // Other notification types can be rendered concurrently (up to limits defined in the processor)
      return true
    },
  })
}
