import { BackgroundType } from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import type { InAppNotification } from '@universe/api'
import type { NotificationClickTarget } from '@universe/notifications'
import { BannerTemplate } from 'notification-service/notification-renderer/BannerTemplate'
import { memo, useMemo } from 'react'

interface LowerLeftBannerNotificationProps {
  notification: InAppNotification
  onNotificationClick?: (notificationId: string, target: NotificationClickTarget) => void
}

/**
 * LowerLeftBannerNotification component
 *
 * A wrapper around BannerTemplate for rendering notification API-driven banners.
 * Delegates click handling to the NotificationService.
 *
 * Features:
 * - Maps notification API types to BannerTemplate props
 * - Delegates click actions to NotificationService via onNotificationClick
 * - Extracts background images and icons from notification content
 *
 * Notification API Type Mapping:
 * - content.title → Banner title
 * - content.subtitle → Banner description
 * - content.background.link → Background image URL (when backgroundType is IMAGE)
 * - content.background.backgroundOnClick → Handled by NotificationService
 */
export const LowerLeftBannerNotification = memo(function LowerLeftBannerNotification({
  notification,
  onNotificationClick,
}: LowerLeftBannerNotificationProps) {
  const content = notification.content

  const handleClose = () => {
    onNotificationClick?.(notification.id, { type: 'dismiss' })
  }

  const handleBannerPress = () => {
    onNotificationClick?.(notification.id, { type: 'background' })
  }

  const backgroundImageUrl = useMemo(() => {
    const background = content?.background
    if (background && background.backgroundType === BackgroundType.IMAGE && background.link) {
      return background.link
    }
    return undefined
  }, [content?.background])

  return (
    <BannerTemplate
      backgroundImageUrl={backgroundImageUrl}
      iconUrl={content?.iconLink}
      title={content?.title ?? ''}
      subtitle={content?.subtitle ?? ''}
      onClose={handleClose}
      onPress={handleBannerPress}
    />
  )
})
