import { isWebPlatform } from '@universe/environment'
import { Button, Flex, type FlexCompatProps, IconButton, Text, zIndexes } from '@universe/mycelium'
// Deep per-icon path: Metro does not tree-shake the icons barrel.
import { X } from '@universe/mycelium/icons/X'
import { useIsDarkMode } from '@universe/mycelium/theme-hooks-compat'
import { ReactNode } from 'react'

const BANNER_WIDTH = 260
const BANNER_HEIGHT = 150
const GRADIENT_BACKGROUND_HEIGHT = 64 // Vertical midpoint of the thumbnail
const ICON_SIZE = 40

/**
 * Background-image painting has no React Native equivalent, so these declarations were web-only
 * under Tamagui too (its native pipeline dropped them). Gated on `isWebPlatform` rather than passed
 * unconditionally, since the compat primitives hand `style` straight to the RN host on native.
 * The URL is a runtime value, so this cannot be a Tailwind class in any case.
 */
const BACKGROUND_IMAGE_CSS = {
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
} as const

const GRADIENT_MASK_CSS = {
  ...BACKGROUND_IMAGE_CSS,
  mask: 'linear-gradient(180deg, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0) 100%)',
} as const

function webBackgroundStyle(
  backgroundImage: string,
  css: typeof BACKGROUND_IMAGE_CSS | typeof GRADIENT_MASK_CSS,
): FlexCompatProps['style'] {
  return isWebPlatform ? { backgroundImage, ...css } : undefined
}

function BannerContainer({ children, ...props }: FlexCompatProps): JSX.Element {
  return (
    <Flex
      borderRadius="$rounded16"
      minHeight={BANNER_HEIGHT}
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 4 }}
      shadowOpacity={0.4}
      shadowRadius={10}
      overflow="hidden"
      padding="$spacing16"
      backgroundColor="$surface1"
      borderWidth={1}
      borderColor="$surface3"
      cursor={props.onPress ? 'pointer' : 'default'}
      {...props}
    >
      {children}
    </Flex>
  )
}

function GradientBackground({ backgroundImage }: { backgroundImage: string }): JSX.Element {
  return (
    <Flex
      position="absolute"
      top={0}
      left={0}
      right={0}
      width="100%"
      height={GRADIENT_BACKGROUND_HEIGHT}
      style={webBackgroundStyle(backgroundImage, GRADIENT_MASK_CSS)}
    />
  )
}

function IconContainer({ backgroundImage }: { backgroundImage: string }): JSX.Element {
  return (
    <Flex
      width={ICON_SIZE}
      height={ICON_SIZE}
      borderRadius="$rounded6"
      style={webBackgroundStyle(backgroundImage, BACKGROUND_IMAGE_CSS)}
    />
  )
}

function ContentWrapper({ children }: { children?: ReactNode }): JSX.Element {
  return (
    <Flex flex={1} justifyContent="space-between" paddingTop={16}>
      {children}
    </Flex>
  )
}

function BannerXButton({ handleClose }: { handleClose: () => void }): JSX.Element {
  return (
    <Flex row centered position="absolute" right={8} top={8} zIndex={zIndexes.mask}>
      <IconButton
        size="xxsmall"
        emphasis="secondary"
        icon={<X />}
        onPress={(e) => {
          stopPropagation(e)
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
    <BannerContainer pointerEvents="auto" width={width ?? BANNER_WIDTH} onPress={onPress}>
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
                stopPropagation(e)
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

/** Defensive: tsc only sees the web leg's event type, so don't assume every leg's event has `stopPropagation`. */
function stopPropagation(event: object): void {
  if ('stopPropagation' in event && typeof event.stopPropagation === 'function') {
    event.stopPropagation()
  }
}
