import { ContentStyle, type InAppNotification } from '@universe/api'
import { type NotificationClickTarget } from '@universe/notifications'
import { InlineBannerNotification } from '@universe/notifications/src/notification-renderer/components/InlineBannerNotification'
import { memo, useEffect, useMemo } from 'react'
import { isStorageWarningNotification } from 'src/notification-service/data-sources/reactive/storageWarningCondition'
import {
  extensionNotificationStore,
  type NotificationState,
} from 'src/notification-service/notification-renderer/notificationStore'
import { AppRatingModalRenderer } from 'src/notification-service/renderers/AppRatingModalRenderer'
import { StorageWarningModalRenderer } from 'src/notification-service/renderers/StorageWarningModalRenderer'
import { isAppRatingNotification } from 'src/notification-service/triggers/appRatingTrigger'
import { isLocalTriggerNotification } from 'src/notification-service/triggers/createExtensionLocalTriggerDataSource'
import { ModalNotification } from 'uniswap/src/components/notifications/ModalNotification'
import { getLogger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { type IntroCardProps } from 'wallet/src/components/introCards/IntroCard'
import { IntroCardStack } from 'wallet/src/components/introCards/IntroCardStack'
import {
  convertNotificationToIntroCard,
  shouldRenderAsIntroCard,
} from 'wallet/src/features/notifications/convertNotificationToIntroCard'
import { type StoreApi, type UseBoundStore } from 'zustand'

/**
 * Routes a notification to the appropriate renderer based on its style
 */
function Notification({
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
  const isUnknownStyle = style !== ContentStyle.MODAL && style !== ContentStyle.LOWER_LEFT_BANNER

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

  // ContentStyle.LOWER_LEFT_BANNER
  // Intro cards are handled by IntroCardStack in NotificationContainer
  if (shouldRenderAsIntroCard(notification)) {
    // Intro cards shouldn't reach here since they're filtered in NotificationContainer
    getLogger().warn(
      'NotificationRenderer',
      'renderNotification',
      'IntroCard notification reached NotificationRenderer - should be handled by IntroCardStack',
      { notification },
    )
    return null
  }

  // Standard banner notification
  return <InlineBannerNotification notification={notification} onNotificationClick={onNotificationClick} width="100%" />
}

/**
 * Subscribes to the notification store and renders active notifications depending on their style.
 */
export const NotificationContainer = memo(function NotificationContainer({
  onRenderFailed,
  onNotificationClick,
  onNotificationShown,
  store = extensionNotificationStore,
}: {
  onRenderFailed?: (notificationId: string) => void
  onNotificationClick?: (notificationId: string, target: NotificationClickTarget) => void
  onNotificationShown?: (notificationId: string) => void
  store?: UseBoundStore<StoreApi<NotificationState>>
}) {
  const activeNotifications = store((state) => state.activeNotifications)
  const removeNotification = store((state) => state.removeNotification)

  const handleRenderFailed = useEvent((notificationId: string) => {
    removeNotification(notificationId)
    onRenderFailed?.(notificationId)
  })

  const handleIntroCardPress = useEvent((notificationId: string) => {
    onNotificationClick?.(notificationId, { type: 'background' })
  })

  const handleIntroCardClose = useEvent((notificationId: string) => {
    onNotificationClick?.(notificationId, { type: 'dismiss' })
  })

  // Separate notifications by type: intro cards, local triggers, system banners, and standard notifications
  const { introCardNotifications, localTriggerNotifications, systemBannerNotifications, standardNotifications } =
    useMemo(() => {
      const introCards: InAppNotification[] = []
      const localTriggers: InAppNotification[] = []
      const systemBanners: InAppNotification[] = []
      const standard: InAppNotification[] = []

      activeNotifications.forEach((notification) => {
        if (notification.content?.style === ContentStyle.SYSTEM_BANNER) {
          // System banners (storage warning, etc.) use SYSTEM_BANNER style
          systemBanners.push(notification)
        } else if (shouldRenderAsIntroCard(notification)) {
          introCards.push(notification)
        } else if (isLocalTriggerNotification(notification.id)) {
          localTriggers.push(notification)
        } else {
          standard.push(notification)
        }
      })

      return {
        introCardNotifications: introCards,
        localTriggerNotifications: localTriggers,
        systemBannerNotifications: systemBanners,
        standardNotifications: standard,
      }
    }, [activeNotifications])

  // Convert intro card notifications to IntroCardProps
  const introCards: IntroCardProps[] = useMemo(() => {
    return introCardNotifications
      .map((notification) => {
        return convertNotificationToIntroCard(notification, {
          onPress: () => handleIntroCardPress(notification.id),
          onClose: () => handleIntroCardClose(notification.id),
        })
      })
      .filter((card): card is IntroCardProps => card !== null)
  }, [introCardNotifications, handleIntroCardPress, handleIntroCardClose])

  return (
    <>
      {/* Render intro cards in a stack */}
      {introCards.length > 0 && <IntroCardStack cards={introCards} onNotificationShown={onNotificationShown} />}

      {/* Render local trigger notifications with custom renderers */}
      {localTriggerNotifications.map((notification) => {
        if (isAppRatingNotification(notification)) {
          return (
            <AppRatingModalRenderer
              key={notification.id}
              notification={notification}
              onNotificationClick={onNotificationClick}
              onNotificationShown={onNotificationShown}
            />
          )
        }
        // Add more local trigger renderers here as they are migrated
        // e.g., if (isSmartWalletCreatedNotification(notification)) { ... }
        getLogger().warn(
          'NotificationContainer',
          'localTriggerNotifications',
          `Unknown local trigger notification: ${notification.id}`,
          { notification },
        )
        return null
      })}

      {/* Render system banner notifications (storage warning, etc.) */}
      {systemBannerNotifications.map((notification) => {
        if (isStorageWarningNotification(notification)) {
          return (
            <StorageWarningModalRenderer
              key={notification.id}
              notification={notification}
              onNotificationClick={onNotificationClick}
              onNotificationShown={onNotificationShown}
            />
          )
        }
        getLogger().warn(
          'NotificationContainer',
          'systemBannerNotifications',
          `Unknown system banner notification: ${notification.id}`,
          { notification },
        )
        return null
      })}

      {/* Render standard notification types (modals, banners, etc) */}
      {standardNotifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onRenderFailed={handleRenderFailed}
          onNotificationClick={onNotificationClick}
          onNotificationShown={onNotificationShown}
        />
      ))}
    </>
  )
})
