import { ContentStyle, type InAppNotification } from '@universe/api'
import type { NotificationClickTarget } from '@universe/notifications'
import { InlineBannerNotification } from '@universe/notifications/src/notification-renderer/components/InlineBannerNotification'
import { Fragment, memo, useEffect, useMemo } from 'react'
import { isOfflineBannerNotification } from 'src/notification-service/data-sources/reactive/offlineCondition'
import {
  ForceUpgradeNotification,
  isForceUpgradeNotification,
} from 'src/notification-service/notification-renderer/ForceUpgradeNotification'
import {
  mobileNotificationStore,
  type NotificationState,
} from 'src/notification-service/notification-renderer/notificationStore'
import { useSystemBannerPortal } from 'src/notification-service/notification-renderer/SystemBannerPortal'
import { BackupReminderModalRenderer } from 'src/notification-service/renderers/BackupReminderModalRenderer'
import { OfflineBannerRenderer } from 'src/notification-service/renderers/OfflineBannerRenderer'
import { isBackupReminderNotification } from 'src/notification-service/triggers/backupReminderTrigger'
import { isLocalTriggerNotification } from 'src/notification-service/triggers/createMobileLocalTriggerDataSource'
import { Flex } from 'ui/src'
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
 * Routes a notification to the appropriate renderer based on its style.
 * Note: Force upgrade notifications are handled separately in NotificationContainer
 * to preserve proper hook ordering.
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
}): JSX.Element | null {
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

    return (): void => clearTimeout(timeoutId)
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
  return <InlineBannerNotification notification={notification} width="100%" onNotificationClick={onNotificationClick} />
}

/**
 * Subscribes to the notification store and renders active notifications depending on their style.
 */
export const NotificationContainer = memo(function NotificationContainer({
  onRenderFailed,
  onNotificationClick,
  onNotificationShown,
  store = mobileNotificationStore,
}: {
  onRenderFailed?: (notificationId: string) => void
  onNotificationClick?: (notificationId: string, target: NotificationClickTarget) => void
  onNotificationShown?: (notificationId: string) => void
  store?: UseBoundStore<StoreApi<NotificationState>>
}): JSX.Element {
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

  // Access the system banner portal for rendering at app root level
  const { setContent: setSystemBannerContent } = useSystemBannerPortal()

  // Separate notifications by type for specialized rendering
  const {
    introCardNotifications,
    localTriggerNotifications,
    systemBannerNotifications,
    forceUpgradeNotifications,
    otherNotifications,
  } = useMemo(() => {
    const introCards: InAppNotification[] = []
    const localTriggers: InAppNotification[] = []
    const systemBanners: InAppNotification[] = []
    const forceUpgrades: InAppNotification[] = []
    const others: InAppNotification[] = []

    activeNotifications.forEach((notification) => {
      if (isForceUpgradeNotification(notification)) {
        forceUpgrades.push(notification)
      } else if (notification.content?.style === ContentStyle.SYSTEM_BANNER) {
        systemBanners.push(notification)
      } else if (shouldRenderAsIntroCard(notification)) {
        introCards.push(notification)
      } else if (isLocalTriggerNotification(notification.id)) {
        localTriggers.push(notification)
      } else {
        others.push(notification)
      }
    })

    return {
      introCardNotifications: introCards,
      localTriggerNotifications: localTriggers,
      systemBannerNotifications: systemBanners,
      forceUpgradeNotifications: forceUpgrades,
      otherNotifications: others,
    }
  }, [activeNotifications])

  // Render system banners through the portal at the app root level
  // This ensures position: absolute + bottom: 0 works correctly
  useEffect(() => {
    if (systemBannerNotifications.length === 0) {
      setSystemBannerContent(null)
      return () => setSystemBannerContent(null)
    }

    const content = (
      <Fragment>
        {systemBannerNotifications.map((notification) => {
          if (isOfflineBannerNotification(notification)) {
            return (
              <OfflineBannerRenderer
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
      </Fragment>
    )
    setSystemBannerContent(content)

    return () => setSystemBannerContent(null)
  }, [systemBannerNotifications, onNotificationClick, onNotificationShown, setSystemBannerContent])

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
      {/* Render intro cards in a stack with padding matching OnboardingIntroCardStack */}
      {introCards.length > 0 && (
        <Flex pt="$spacing12" px="$spacing12" width="100%">
          <IntroCardStack cards={introCards} onNotificationShown={onNotificationShown} />
        </Flex>
      )}

      {/* Render force upgrade notifications with custom UI */}
      {forceUpgradeNotifications.map((notification) => (
        <ForceUpgradeNotification
          key={notification.id}
          notification={notification}
          onNotificationClick={onNotificationClick}
          onNotificationShown={onNotificationShown}
        />
      ))}

      {/* Render local trigger notifications with custom renderers */}
      {localTriggerNotifications.map((notification) => {
        if (isBackupReminderNotification(notification)) {
          return (
            <BackupReminderModalRenderer
              key={notification.id}
              notification={notification}
              onNotificationClick={onNotificationClick}
              onNotificationShown={onNotificationShown}
            />
          )
        }
        // Log warning for unknown local trigger notification
        getLogger().warn(
          'NotificationContainer',
          'localTriggerNotifications',
          `Unknown local trigger notification: ${notification.id}`,
          { notification },
        )
        return null
      })}

      {/* System banner notifications are rendered via SystemBannerPortal at the app root */}

      {/* Render other notification types (modals, standard banners, etc) */}
      {otherNotifications.map((notification) => (
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
