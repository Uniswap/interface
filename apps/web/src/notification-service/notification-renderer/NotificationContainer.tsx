/* eslint-disable import/no-unused-modules */
import { ContentStyle, type InAppNotification } from '@universe/api'
import { type NotificationClickTarget } from '@universe/notifications'
import { useEffect, useMemo } from 'react'
import { ModalNotification } from 'uniswap/src/components/notifications/ModalNotification'
import { getLogger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { type StoreApi, type UseBoundStore } from 'zustand'
import { SystemBannerNotification } from '~/notification-service/notification-renderer/components/SystemBannerNotification'
import {
  type NotificationState,
  useNotificationStore,
} from '~/notification-service/notification-renderer/notificationStore'
import { StackedLowerLeftBanners } from '~/notification-service/notification-renderer/StackedLowerLeftBanners'

/**
 * Routes a notification to the appropriate renderer based on its style
 * Note: LOWER_LEFT_BANNER and SYSTEM_BANNER notifications are handled separately in NotificationContainer
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
  const isKnownStyle =
    style === ContentStyle.MODAL || style === ContentStyle.LOWER_LEFT_BANNER || style === ContentStyle.SYSTEM_BANNER
  const isUnknownStyle = !isKnownStyle

  // Handle unknown/invalid notification styles as a side effect
  // This handles cases where the server sends string enums on first request and numeric
  // enums on subsequent requests. Clean up without marking as processed to allow retry.
  useEffect(() => {
    if (!isUnknownStyle) {
      return () => null
    }

    getLogger().warn(
      'NotificationRenderer',
      'renderNotification',
      `Unknown notification style: ${style}, cleaning up failed render to allow retry with correct data`,
      {
        notification,
      },
    )

    const timeoutId = setTimeout(() => {
      onRenderFailed?.(notification.id)
    }, 1)

    return () => clearTimeout(timeoutId)
  }, [isUnknownStyle, style, notification, onRenderFailed])

  if (isUnknownStyle) {
    return null
  }

  if (style === ContentStyle.MODAL) {
    return (
      <ModalNotification
        notification={notification}
        onNotificationClick={onNotificationClick}
        onNotificationShown={onNotificationShown}
      />
    )
  }

  // ContentStyle.LOWER_LEFT_BANNER and SYSTEM_BANNER - handled separately in NotificationContainer
  return null
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

  // Separate notifications by style for specialized rendering
  const { lowerLeftBannerNotifications, systemBannerNotifications, otherNotifications } = useMemo(() => {
    const lowerLeftBanners: InAppNotification[] = []
    const systemBanners: InAppNotification[] = []
    const others: InAppNotification[] = []

    activeNotifications.forEach((notification) => {
      const style = notification.content?.style
      if (style === ContentStyle.LOWER_LEFT_BANNER) {
        lowerLeftBanners.push(notification)
      } else if (style === ContentStyle.SYSTEM_BANNER) {
        systemBanners.push(notification)
      } else {
        others.push(notification)
      }
    })

    return {
      lowerLeftBannerNotifications: lowerLeftBanners,
      systemBannerNotifications: systemBanners,
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

      {/* Render system banner notifications (bottom-right, one at a time) */}
      {systemBannerNotifications.map((notification) => (
        <SystemBannerNotification
          key={notification.id}
          notification={notification}
          onNotificationClick={onNotificationClick}
          onNotificationShown={onNotificationShown}
        />
      ))}

      {/* Render other notification types (modals, etc.) */}
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
