import { BackgroundType } from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import type { InAppNotification } from '@universe/api'
import { BannerTemplate } from '@universe/notifications/src/notification-renderer/components/BannerTemplate'
import { type NotificationClickTarget } from '@universe/notifications/src/notification-service/NotificationService'
import { memo, useMemo } from 'react'

interface InlineBannerNotificationProps {
  notification: InAppNotification
  onNotificationClick?: (notificationId: string, target: NotificationClickTarget) => void
}

/**
 * InlineBannerNotification component
 *
 * A wrapper around BannerTemplate for rendering notification API-driven banners.
 * Can be used inline (extension/mobile) or in fixed position (web).
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
export const InlineBannerNotification = memo(function InlineBannerNotification({
  notification,
  onNotificationClick,
}: InlineBannerNotificationProps) {
  const content = notification.content

  const handleClose = (): void => {
    onNotificationClick?.(notification.id, { type: 'dismiss' })
  }

  const handleBannerPress = (): void => {
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
