import { ContentStyle, type InAppNotification } from '@universe/api'
import { createNotificationRenderer, type NotificationRenderer } from '@universe/notifications'
import { type NotificationState } from 'src/notification-service/notification-renderer/notificationStore'
import { type StoreApi, type UseBoundStore } from 'zustand'

interface CreateMobileNotificationRendererContext {
  store: UseBoundStore<StoreApi<NotificationState>>
}

/**
 * Creates a mobile-specific NotificationRenderer that uses Zustand store.
 * This renderer coordinates rendering for all notification types on mobile.
 */
export function createMobileNotificationRenderer(ctx: CreateMobileNotificationRendererContext): NotificationRenderer {
  const store = ctx.store

  return createNotificationRenderer({
    render: (notification: InAppNotification): (() => void) => {
      store.getState().addNotification(notification)

      return (): void => {
        store.getState().removeNotification(notification.id)
      }
    },

    canRender: (notification: InAppNotification): boolean => {
      const { activeNotifications } = store.getState()
      const style = notification.content?.style

      if (style === ContentStyle.MODAL) {
        const hasActiveModal = activeNotifications.some((n) => n.content?.style === ContentStyle.MODAL)
        return !hasActiveModal
      }

      return true
    },
  })
}
