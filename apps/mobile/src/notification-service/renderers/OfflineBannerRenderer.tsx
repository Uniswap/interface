import { type InAppNotification } from '@universe/api'
import { type NotificationClickTarget } from '@universe/notifications'
import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BANNER_HEIGHT, BottomBanner } from 'src/components/banners/BottomBanner'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'

const EXTRA_MARGIN = 5

interface OfflineBannerRendererProps {
  notification: InAppNotification
  onNotificationClick?: (notificationId: string, target: NotificationClickTarget) => void
  onNotificationShown?: (notificationId: string) => void
}

/**
 * Renderer for the offline banner notification.
 *
 * This component preserves the exact UI of the original OfflineBanner component:
 * - Bottom fixed position banner
 * - InfoCircle icon
 * - Translated "You're offline" text
 * - 45px height with animation
 * - Dismissable via X button (per-session only)
 *
 * Note: __DEV__ mode check is NOT done here - the condition should not
 * emit notifications in dev mode. This keeps the renderer pure and
 * focused on presentation only.
 *
 * @see OfflineBanner for the original implementation
 */
export function OfflineBannerRenderer({
  notification,
  onNotificationClick,
  onNotificationShown,
}: OfflineBannerRendererProps): JSX.Element {
  const { t } = useTranslation()

  // Report when the banner is shown
  useEffect(() => {
    onNotificationShown?.(notification.id)
  }, [notification.id, onNotificationShown])

  // Handle dismiss - uses session-scoped tracking (local:session: prefix)
  // so the banner will reappear on app restart if still offline
  const handleDismiss = useCallback(() => {
    onNotificationClick?.(notification.id, { type: 'dismiss' })
  }, [notification.id, onNotificationClick])

  return (
    <BottomBanner
      backgroundColor="$surface2"
      icon={<InfoCircle color="$neutral1" size="$icon.24" />}
      text={t('home.banner.offline')}
      translateY={BANNER_HEIGHT - EXTRA_MARGIN}
      onDismiss={handleDismiss}
    />
  )
}
