/* eslint-disable import/no-unused-modules */
import { ContentStyle, type InAppNotification } from '@universe/api'
import type { NotificationClickTarget } from '@universe/notifications'
import { ModalNotification } from 'notification-service/notification-renderer/ModalNotification'
import {
  type NotificationState,
  useNotificationStore,
} from 'notification-service/notification-renderer/notificationStore'
import { StackedLowerLeftBanners } from 'notification-service/notification-renderer/StackedLowerLeftBanners'
import { useMemo } from 'react'
import { getLogger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { type StoreApi, type UseBoundStore } from 'zustand'

/**
 * Routes a notification to the appropriate renderer based on its style
 * Note: LOWER_LEFT_BANNER notifications are handled separately in NotificationContainer
 */
function NotificationRenderer({
  notification,
  onRenderFailed,
  onNotificationClick,
  onNotificationShown,
}: {
  notification: InAppNotification
  onRenderFailed?: (id: string) => void
  onNotificationClick?: (notificationId: string, target: NotificationClickTarget) => void
  onNotificationShown?: (notificationId: string) => void
}) {
  const style = notification.content?.style
  switch (style) {
    case ContentStyle.MODAL:
      return (
        <ModalNotification
          notification={notification}
          onNotificationClick={onNotificationClick}
          onNotificationShown={onNotificationShown}
        />
      )
    case ContentStyle.LOWER_LEFT_BANNER:
      // Lower left banners are handled by StackedLowerLeftBanners in NotificationContainer
      return null
    default:
      // Handle unknown/invalid notification styles
      // This handles cases where the server sends string enums on first request and numeric
      // enums on subsequent requests. Clean up without marking as processed to allow retry.
      getLogger().warn(
        'NotificationRenderer',
        'renderNotification',
        `Unknown notification style: ${style}, cleaning up failed render to allow retry with correct data`,
        {
          notification,
        },
      )
      // Delay the cleanup to allow the notification to be rendered
      setTimeout(() => {
        onRenderFailed?.(notification.id)
      }, 1)
      return null
  }
}

/**
 * NotificationContainer component
 * Subscribes to the notification store and renders active notifications
 * Should be mounted at the app root level
 */
export function NotificationContainer({
  onRenderFailed,
  onNotificationShown,
  onNotificationClick,
  store = useNotificationStore,
}: {
  onRenderFailed?: (notificationId: string) => void
  onNotificationShown?: (notificationId: string) => void
  onNotificationClick?: (notificationId: string, target: NotificationClickTarget) => void
  store?: UseBoundStore<StoreApi<NotificationState>>
}) {
  const activeNotifications = store((state) => state.activeNotifications)
  const removeNotification = store((state) => state.removeNotification)

  const handleRenderFailed = useEvent((notificationId: string) => {
    removeNotification(notificationId)
    onRenderFailed?.(notificationId)
  })

  // Separate lower left banner notifications from other notifications
  const { lowerLeftBannerNotifications, otherNotifications } = useMemo(() => {
    const lowerLeftBanners: InAppNotification[] = []
    const others: InAppNotification[] = []

    activeNotifications.forEach((notification) => {
      if (notification.content?.style === ContentStyle.LOWER_LEFT_BANNER) {
        lowerLeftBanners.push(notification)
      } else {
        others.push(notification)
      }
    })

    return {
      lowerLeftBannerNotifications: lowerLeftBanners,
      otherNotifications: others,
    }
  }, [activeNotifications])

  return (
    <>
      {/* Render stacked lower left banner notifications */}
      <StackedLowerLeftBanners
        notifications={lowerLeftBannerNotifications}
        onNotificationClick={onNotificationClick}
        onNotificationShown={onNotificationShown}
      />

      {/* Render other notification types */}
      {otherNotifications.map((notification) => (
        <NotificationRenderer
          key={notification.id}
          notification={notification}
          onRenderFailed={handleRenderFailed}
          onNotificationClick={onNotificationClick}
          onNotificationShown={onNotificationShown}
        />
      ))}
    </>
  )
}
