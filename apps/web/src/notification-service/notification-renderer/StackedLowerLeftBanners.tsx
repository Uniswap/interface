import type { InAppNotification } from '@universe/api'
import { Flex, useMedia, zIndexes } from '@universe/mycelium'
import { curveToAnimationTiming } from '@universe/mycelium/compat'
import { Portal } from '@universe/mycelium/portal'
import { Presence, type PresenceExitProps } from '@universe/mycelium/presence'
import { InlineBannerNotification, type NotificationClickTarget } from '@universe/notifications'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { memo, useEffect, type CSSProperties } from 'react'
import { useEvent } from 'utilities/src/react/hooks'
import { calculateStackingProps, MAX_STACKED_BANNERS } from '~/notification-service/notification-renderer/stackingUtils'

const EXIT_DROP_PX = 24
const EXIT_Z_INDEX = 1035 // Above the stack but below modalBackdrop (1040)

// The exit target (drop by EXIT_DROP_PX below the banner's own stacked offset, keeping its
// stacked scale) is dynamic per banner, so it rides the parameterized presence exit keyframe
// through per-banner CSS custom properties instead of a pinned preset.
const BANNER_EXIT_CLASSES = 'data-exiting:animate-spore-exit-presence'

// Timing of the legacy '300ms' animation preset.
const BANNER_EXIT_TIMING: CSSProperties = curveToAnimationTiming(SPORE_ANIMATION_CURVE_CSS['300ms'])

// Legacy exitStyle raised every exiting banner above the stack for the drop-out.
function getBannerExitProps(): PresenceExitProps {
  return { style: { zIndex: EXIT_Z_INDEX } }
}

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
      <Presence initial={false} getExitProps={getBannerExitProps}>
        {stackedNotifications.map((notification, index) => {
          const { scale, offsetY, zIndex } = calculateStackingProps(index, stackedNotifications.length)

          return (
            <Flex
              key={notification.id}
              transition={`transform ${SPORE_ANIMATION_CURVE_CSS['300ms']}, opacity ${SPORE_ANIMATION_CURVE_CSS['300ms']}`}
              scale={scale}
              y={offsetY}
              opacity={1}
              zIndex={zIndex}
              className={BANNER_EXIT_CLASSES}
              style={
                {
                  position: 'fixed',
                  left: leftPosition,
                  bottom: 29,
                  transformOrigin: '50% 100%',
                  willChange: 'transform, opacity',
                  '--spore-presence-exit-y': `${offsetY + EXIT_DROP_PX}px`,
                  '--spore-presence-exit-scale': `${scale}`,
                  ...BANNER_EXIT_TIMING,
                } as CSSProperties
              }
            >
              <InlineBannerNotification
                notification={notification}
                onNotificationClick={onNotificationClick}
                renderButton
              />
            </Flex>
          )
        })}
      </Presence>
    </Portal>
  )
})
