import { BackgroundType } from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import type { InAppNotification } from '@universe/api'
import {
  BannerTemplate,
  type BannerTemplateButton,
} from '@universe/notifications/src/notification-renderer/components/BannerTemplate'
import { parseCustomIconLink } from '@universe/notifications/src/notification-renderer/utils/iconUtils'
import { type NotificationClickTarget } from '@universe/notifications/src/notification-service/NotificationService'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

const BANNER_ICON_SIZE = 40

interface InlineBannerNotificationProps {
  notification: InAppNotification
  onNotificationClick?: (notificationId: string, target: NotificationClickTarget) => void
  /** Override the default banner width. Use '100%' for full-width. */
  width?: number | string
  /** Enable button rendering. Defaults to false (web only). */
  renderButton?: boolean
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
  width,
  renderButton = false,
}: InlineBannerNotificationProps) {
  const { t, i18n } = useTranslation()
  const content = notification.content

  const handleClose = (): void => {
    onNotificationClick?.(notification.id, { type: 'dismiss' })
  }

  const hasBackgroundClick = !!content?.background?.backgroundOnClick

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

  const darkModeBackgroundImageUrl = useMemo(() => {
    const background = content?.background
    if (background && background.backgroundType === BackgroundType.IMAGE && background.darkModeLink) {
      return background.darkModeLink
    }
    return undefined
  }, [content?.background])

  const customIcon = useMemo(() => {
    const parsed = parseCustomIconLink(content?.iconLink)
    if (!parsed.IconComponent) {
      return undefined
    }
    const Icon = parsed.IconComponent
    return <Icon size={BANNER_ICON_SIZE} color={parsed.colorToken ?? '$neutral1'} />
  }, [content?.iconLink])

  const button = useMemo((): BannerTemplateButton | undefined => {
    if (!renderButton) {
      return undefined
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const firstButton = content?.buttons?.[0]
    if (!firstButton) {
      return undefined
    }

    // Translate known i18n keys, otherwise use raw text
    const buttonText = i18n.exists(firstButton.text) ? t(firstButton.text) : firstButton.text

    return {
      text: buttonText,
      isPrimary: firstButton.isPrimary ?? false,
      onPress: (): void => {
        onNotificationClick?.(notification.id, { type: 'button', index: 0 })
      },
    }
  }, [renderButton, content?.buttons, notification.id, onNotificationClick, t, i18n])

  return (
    <BannerTemplate
      backgroundImageUrl={backgroundImageUrl}
      darkModeBackgroundImageUrl={darkModeBackgroundImageUrl}
      icon={customIcon}
      iconUrl={customIcon ? undefined : content?.iconLink}
      darkModeIconUrl={customIcon ? undefined : content?.darkModeIconLink}
      title={content?.title ?? ''}
      subtitle={content?.subtitle ?? ''}
      width={width}
      button={button}
      onClose={handleClose}
      onPress={hasBackgroundClick ? handleBannerPress : undefined}
    />
  )
})
