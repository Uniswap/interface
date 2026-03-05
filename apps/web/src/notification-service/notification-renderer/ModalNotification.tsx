import { BackgroundType } from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import type { InAppNotification } from '@universe/api'
import type { NotificationClickTarget } from '@universe/notifications'
import { memo, useEffect, useMemo } from 'react'
import {
  type ModalFeatureItem,
  ModalTemplate,
  type ModalTemplateButton,
} from 'uniswap/src/components/notifications/ModalTemplate'
import { useEvent } from 'utilities/src/react/hooks'

interface ModalNotificationProps {
  notification: InAppNotification
  onNotificationClick?: (notificationId: string, target: NotificationClickTarget) => void
  onNotificationShown?: (notificationId: string) => void
}

/**
 * ModalNotification component
 *
 * A wrapper around ModalTemplate for rendering notification API-driven modals.
 * Delegates click handling to the NotificationService.
 *
 * Features:
 * - Maps notification API types to ModalTemplate props
 * - Converts content.body items to feature list
 * - Maps content.buttons to action buttons
 * - Delegates click actions to NotificationService via onNotificationClick
 * - Extracts background images and icons from notification content
 */
export const ModalNotification = memo(function ModalNotification({
  notification,
  onNotificationClick,
  onNotificationShown,
}: ModalNotificationProps) {
  // Content is always defined when this component is rendered (checked in NotificationContainer)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const content = notification.content!

  const handleClose = useEvent(() => {
    onNotificationClick?.(notification.id, { type: 'dismiss' })
  })

  const handleBackgroundPress = useEvent(() => {
    onNotificationClick?.(notification.id, { type: 'background' })
  })

  const backgroundImageUrl = useMemo(() => {
    const background = content.background
    if (background && background.backgroundType === BackgroundType.IMAGE && background.link) {
      return background.link
    }
    return undefined
  }, [content.background])

  const hasBackgroundClick = useMemo(() => {
    const background = content.background
    return background?.backgroundOnClick && background.backgroundOnClick.onClick.length > 0
  }, [content.background])

  const features = useMemo((): ModalFeatureItem[] => {
    if (!content.body?.items) {
      return []
    }

    return content.body.items.map((item) => ({
      text: item.text,
      iconUrl: item.iconUrl,
    }))
  }, [content.body])

  const buttons = useMemo((): ModalTemplateButton[] => {
    if (content.buttons.length === 0) {
      return []
    }

    return content.buttons.map((button, index) => ({
      text: button.text,
      isPrimary: button.isPrimary,
      onPress: () => {
        onNotificationClick?.(notification.id, { type: 'button', index })
      },
    }))
  }, [content.buttons, notification.id, onNotificationClick])

  useEffect(() => {
    onNotificationShown?.(notification.id)
  }, [notification.id, onNotificationShown])

  return (
    <ModalTemplate
      isOpen={true}
      name={notification.id}
      onClose={handleClose}
      backgroundImageUrl={backgroundImageUrl}
      onBackgroundPress={hasBackgroundClick ? handleBackgroundPress : undefined}
      iconUrl={content.iconLink}
      title={content.title}
      subtitle={content.subtitle}
      features={features}
      buttons={buttons}
    />
  )
})
