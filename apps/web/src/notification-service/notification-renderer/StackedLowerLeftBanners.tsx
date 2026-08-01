import type { InAppNotification } from '@universe/api'
import { InlineBannerNotification, type NotificationClickTarget } from '@universe/notifications'
import { memo, useEffect } from 'react'
import { AnimatePresence, Flex, Portal, useMedia } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { useEvent } from 'utilities/src/react/hooks'
import { calculateStackingProps, MAX_STACKED_BANNERS } from '~/notification-service/notification-renderer/stackingUtils'

const EXIT_DROP_PX = 24
const EXIT_Z_INDEX = 1035 // Above the stack but below modalBackdrop (1040)

interface StackedLowerLeftBannersProps {
  notifications: InAppNotification[]
  onNotificationClick?: (notificationId: string, target: NotificationClickTarget) => void
  onNotificationShown?: (notificationId: string) => void
}

/**
 * StackedLowerLeftBanners component
 *
 * Manages the stacking animation for up to 3 lower left banner notifications.
 *
 * Features:
 * - Shows up to 3 notifications in a stacked layout
 * - Top notification: 100% scale, full content opacity
 * - 2nd notification: 95% scale, offset vertically
 * - 3rd notification: 90% scale, offset vertically
 * - Animates scale and position when notifications are dismissed
 * - Exit animation: slide down + fade out
 */
export const StackedLowerLeftBanners = memo(function StackedLowerLeftBanners({
  notifications,
  onNotificationClick,
  onNotificationShown,
}: StackedLowerLeftBannersProps) {
  const media = useMedia()
  const leftPosition = media.xl ? 20 : 40

  // Reverse the notifications so the first notification renders last (on top)
  const stackedNotifications = notifications.slice(0, MAX_STACKED_BANNERS).reverse()

  // The top notification is the last one in the reversed array (highest index)
  const topNotificationId = stackedNotifications[stackedNotifications.length - 1]?.id

  const handleNotificationShown = useEvent((id: string) => {
    onNotificationShown?.(id)
  })

  useEffect(() => {
    if (topNotificationId) {
      handleNotificationShown(topNotificationId)
    }
  }, [topNotificationId, handleNotificationShown])

  return (
    <Portal zIndex={zIndexes.fixed + 10}>
      <AnimatePresence initial={false}>
        {stackedNotifications.map((notification, index) => {
          const { scale, offsetY, zIndex } = calculateStackingProps(index, stackedNotifications.length)

          return (
            <Flex
              key={notification.id}
              animation="300ms"
              animateOnly={['transform', 'opacity']}
              scale={scale}
              y={offsetY}
              opacity={1}
              zIndex={zIndex}
              exitStyle={{
                y: offsetY + EXIT_DROP_PX,
                opacity: 0,
                zIndex: EXIT_Z_INDEX,
              }}
              style={{
                position: 'fixed',
                left: leftPosition,
                bottom: 29,
                transformOrigin: '50% 100%',
                willChange: 'transform, opacity',
              }}
            >
              <InlineBannerNotification
                notification={notification}
                onNotificationClick={onNotificationClick}
                renderButton
              />
            </Flex>
          )
        })}
      </AnimatePresence>
    </Portal>
  )
})
