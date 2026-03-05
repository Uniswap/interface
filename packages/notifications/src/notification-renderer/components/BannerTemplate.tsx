import { ReactNode } from 'react'
import { Button, Flex, IconButton, styled, Text, useIsDarkMode } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { zIndexes } from 'ui/src/theme'

const BANNER_WIDTH = 260
const BANNER_HEIGHT = 150
const GRADIENT_BACKGROUND_HEIGHT = 64 // Vertical midpoint of the thumbnail
const ICON_SIZE = 40

const BannerContainer = styled(Flex, {
  borderRadius: '$rounded16',
  minHeight: BANNER_HEIGHT,
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 10,
  overflow: 'hidden',
  padding: '$spacing16',
  backgroundColor: '$surface1',
  borderWidth: 1,
  borderColor: '$surface3',
  variants: {
    clickable: {
      true: {
        cursor: 'pointer',
      },
      false: {
        cursor: 'default',
      },
    },
  } as const,
})

const GradientBackground = styled(Flex, {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  width: '100%',
  height: GRADIENT_BACKGROUND_HEIGHT,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  mask: 'linear-gradient(180deg, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0) 100%)',
})

const IconContainer = styled(Flex, {
  width: ICON_SIZE,
  height: ICON_SIZE,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  borderRadius: '$rounded6',
})

const ContentWrapper = styled(Flex, {
  flex: 1,
  justifyContent: 'space-between',
  paddingTop: 16,
})

function BannerXButton({ handleClose }: { handleClose: () => void }): JSX.Element {
  return (
    <Flex row centered position="absolute" right={8} top={8} zIndex={zIndexes.mask}>
      <IconButton
        size="xxsmall"
        emphasis="secondary"
        icon={<X />}
        onPress={(e) => {
          e.stopPropagation()
          handleClose()
        }}
      />
    </Flex>
  )
}

export interface BannerTemplateButton {
  text: string
  onPress: () => void
  isPrimary?: boolean
}

interface BannerTemplateProps {
  backgroundImageUrl?: string
  /** Optional dark mode variant for backgroundImageUrl. Falls back to backgroundImageUrl if not provided. */
  darkModeBackgroundImageUrl?: string
  /** Pre-rendered icon element. When provided, takes priority over iconUrl. */
  icon?: ReactNode
  iconUrl?: string
  /** Optional dark mode variant for iconUrl. Falls back to iconUrl if not provided. */
  darkModeIconUrl?: string
  title: string
  subtitle?: string
  onClose: () => void
  onPress?: () => void
  children?: ReactNode
  /** Override the default banner width. Use '100%' for full-width. */
  width?: number | string
  /** Optional button to display below the content */
  button?: BannerTemplateButton
}

/**
 * BannerTemplate component
 *
 * A reusable template for rendering lower-banner notifications.
 * Extracted from SolanaPromoBanner to be shared across the notification system.
 *
 * Features:
 * - Fixed position in lower-left corner
 * - Optional background image with gradient overlay
 * - Optional icon
 * - Title and subtitle text (or custom children)
 * - Dismiss button
 * - Click handler support
 */
export function BannerTemplate({
  backgroundImageUrl,
  darkModeBackgroundImageUrl,
  icon,
  iconUrl,
  darkModeIconUrl,
  title,
  subtitle,
  onClose,
  onPress,
  children,
  width,
  button,
}: BannerTemplateProps): JSX.Element {
  const isDarkMode = useIsDarkMode()
  const effectiveBackgroundUrl =
    isDarkMode && darkModeBackgroundImageUrl ? darkModeBackgroundImageUrl : backgroundImageUrl
  const effectiveIconUrl = isDarkMode && darkModeIconUrl ? darkModeIconUrl : iconUrl

  return (
    <BannerContainer pointerEvents="auto" width={width ?? BANNER_WIDTH} clickable={!!onPress} onPress={onPress}>
      <BannerXButton handleClose={onClose} />

      {effectiveBackgroundUrl && <GradientBackground backgroundImage={`url(${effectiveBackgroundUrl})`} />}

      <ContentWrapper>
        <Flex gap="$spacing8">
          {icon ? (
            <Flex centered width={ICON_SIZE} height={ICON_SIZE}>
              {icon}
            </Flex>
          ) : effectiveIconUrl ? (
            <IconContainer backgroundImage={`url(${effectiveIconUrl})`} />
          ) : (
            <Flex width={ICON_SIZE} height={ICON_SIZE} backgroundColor="transparent" />
          )}

          {children || (
            <Flex gap="$spacing4">
              <Text variant="body3" color="$neutral1">
                {title}
              </Text>
              {subtitle && (
                <Text variant="body4" color="$neutral2">
                  {subtitle}
                </Text>
              )}
            </Flex>
          )}
        </Flex>

        {button && (
          <Flex marginTop="$spacing12">
            <Button
              size="medium"
              emphasis={button.isPrimary ? 'primary' : 'secondary'}
              minHeight="$spacing36"
              onPress={(e) => {
                e.stopPropagation()
                button.onPress()
              }}
            >
              {button.text}
            </Button>
          </Flex>
        )}
      </ContentWrapper>
    </BannerContainer>
  )
}
