import type { InAppNotification } from '@universe/api'
import { type NotificationClickTarget } from '@universe/notifications'
import { memo, useEffect, useMemo } from 'react'
import { Flex, styled, Text, useSporeColors } from 'ui/src'
import type { GeneratedIcon } from 'ui/src/components/factories/createIcon'
import { Globe } from 'ui/src/components/icons/Globe'
import { X } from 'ui/src/components/icons/X'
import { iconSizes, zIndexes } from 'ui/src/theme'
import { useShadowPropsShort } from 'ui/src/theme/shadows'
import { getCustomIconComponent } from 'uniswap/src/components/notifications/iconUtils'
import { ExternalLink } from '~/theme/components/Links'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

// Close button container - Flex handles onPress→onClick on web, unlike raw SVG icons
const CloseButtonContainer = styled(Flex, {
  ...ClickableTamaguiStyle,
  centered: true,
  p: '$spacing4',
  right: 6,
  top: 8,
  borderRadius: '$roundedFull',
  backgroundColor: '$surface5',
  position: 'absolute',
})

/**
 * Gets the icon component for a notification based on its iconLink.
 * Uses the shared CUSTOM_ICON_MAP for consistency with other notification types.
 */
function getIconForNotification(iconLink: string | undefined): GeneratedIcon {
  const IconComponent = getCustomIconComponent(iconLink)
  return IconComponent ?? Globe
}

interface SystemBannerNotificationProps {
  notification: InAppNotification
  onNotificationClick?: (notificationId: string, target: NotificationClickTarget) => void
  onNotificationShown?: (notificationId: string) => void
}

/**
 * SystemBannerNotification component for rendering system alerts.
 *
 * Displays sticky system notifications in the bottom-right corner with:
 * - Warning icon (Globe, AlertTriangle, etc.)
 * - Title and subtitle text
 * - Optional "Learn more" link
 * - Dismiss button
 *
 * Used for:
 * - Chain connectivity warnings
 * - Outage banners
 * - Limited data warnings
 *
 * Styling matches the existing OutageBanner design with Tamagui.
 */
export const SystemBannerNotification = memo(function SystemBannerNotification({
  notification,
  onNotificationClick,
  onNotificationShown,
}: SystemBannerNotificationProps) {
  const colors = useSporeColors()
  const shadowProps = useShadowPropsShort()
  const content = notification.content

  // Extract notification content
  const title = content?.title ?? ''
  const subtitle = content?.subtitle ?? ''
  const IconComponent = useMemo(() => getIconForNotification(content?.iconLink), [content?.iconLink])

  // Extract first button as "Learn more" link if it exists
  const learnMoreButton = useMemo(() => {
    const buttons = content?.buttons ?? []
    return buttons.length > 0 ? buttons[0] : undefined
  }, [content?.buttons])

  // Notify when shown
  useEffect(() => {
    onNotificationShown?.(notification.id)
  }, [notification.id, onNotificationShown])

  const handleDismiss = (): void => {
    onNotificationClick?.(notification.id, { type: 'dismiss' })
  }

  const handleButtonClick = (index: number): void => {
    onNotificationClick?.(notification.id, { type: 'button', index })
  }

  return (
    <Flex
      width={360}
      maxWidth="95%"
      backgroundColor={colors.surface1.val}
      zIndex={zIndexes.sticky}
      borderRadius="$rounded20"
      borderStyle="solid"
      borderWidth={1.3}
      borderColor={colors.surface3.val}
      $platform-web={{
        position: 'fixed',
        bottom: 40,
        right: 20,
        ...(shadowProps['$platform-web'] || {}),
      }}
      $lg={{
        bottom: 62,
      }}
      $sm={{
        bottom: 80,
      }}
      $xs={{
        right: 10,
        left: 10,
      }}
    >
      <Flex row p="$spacing8" borderRadius="$rounded20" height="100%">
        {/* Icon container */}
        <Flex
          centered
          m="$spacing12"
          mr="$spacing6"
          height={45}
          width={45}
          backgroundColor={colors.statusWarning2.val}
          borderRadius="$rounded12"
        >
          <IconComponent size={28} color={colors.statusWarning.val} />
        </Flex>

        {/* Content container */}
        <Flex gap="$spacing2" p={10} $xs={{ maxWidth: 270 }} flexShrink={1}>
          {title && (
            <Text variant="body2" color={colors.neutral1.val}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text variant="body3" color={colors.neutral2.val}>
              {subtitle}
            </Text>
          )}
          {learnMoreButton && learnMoreButton.onClick?.onClickLink && (
            <ExternalLink href={learnMoreButton.onClick.onClickLink} onClick={() => handleButtonClick(0)}>
              <Text variant="body3" color={colors.accent1.val}>
                {learnMoreButton.text || 'Learn more'}
              </Text>
            </ExternalLink>
          )}
        </Flex>

        {/* Close button */}
        <CloseButtonContainer data-testid="system-banner-close" onPress={handleDismiss}>
          <X size={iconSizes.icon16} color="$neutral2" />
        </CloseButtonContainer>
      </Flex>
    </Flex>
  )
})
