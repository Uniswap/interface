/* eslint-disable import/no-unused-modules */

import type { InAppNotification } from '@universe/api'
import { InlineBannerNotification, type NotificationClickTarget } from '@universe/notifications'
import { AnimatePresence, motion } from 'framer-motion'
import { calculateStackingProps, MAX_STACKED_BANNERS } from 'notification-service/notification-renderer/stackingUtils'
import { memo, useEffect } from 'react'
import { Portal, useMedia } from 'ui/src'
import { useEvent } from 'utilities/src/react/hooks'

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
 * - Exit animation: 90deg counter-clockwise rotation + fade out
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
    <Portal>
      <AnimatePresence initial={false} mode="sync">
        {stackedNotifications.map((notification, index) => {
          const { scale, offsetY, zIndex } = calculateStackingProps(index, stackedNotifications.length)

          return (
            <motion.div
              key={notification.id}
              layout="position"
              initial={{ scale, y: offsetY, opacity: 1, originX: 0.5, originY: 1, zIndex }}
              animate={{ scale, y: offsetY, opacity: 1, originX: 0.5, originY: 1, zIndex }}
              exit={{
                y: offsetY + 24,
                opacity: 0,
                zIndex: 1035, // Above the stack but below modalBackdrop (1040)
              }}
              transition={{
                duration: 0.3,
                ease: 'easeInOut',
              }}
              style={{
                position: 'fixed',
                left: leftPosition,
                bottom: 29,
                willChange: 'transform, opacity',
              }}
            >
              <InlineBannerNotification notification={notification} onNotificationClick={onNotificationClick} />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </Portal>
  )
})
