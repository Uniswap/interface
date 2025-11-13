import { ReactNode } from 'react'
import { Flex, IconButton, styled, Text } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { zIndexes } from 'ui/src/theme'

const BANNER_WIDTH = 260
const BANNER_HEIGHT = 150
const GRADIENT_BACKGROUND_HEIGHT = 75 // Vertical midpoint of the banner
const ICON_SIZE = 40

const BannerContainer = styled(Flex, {
  borderRadius: '$rounded16',
  width: BANNER_WIDTH,
  height: BANNER_HEIGHT,
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 10,
  overflow: 'hidden',
  padding: '$spacing16',
  backgroundColor: '$surface1',
  borderWidth: 1,
  borderColor: '$surface3',
  cursor: 'pointer',
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
  mask: 'linear-gradient(180deg, rgba(0,0,0,0.54) 0%, rgba(0,0,0,0.12) 100%)',
})

const IconContainer = styled(Flex, {
  width: ICON_SIZE,
  height: ICON_SIZE,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  borderRadius: '$rounded6',
  marginTop: '$spacing16',
})

const ContentWrapper = styled(Flex, {
  gap: '$spacing8',
  flex: 1,
  justifyContent: 'flex-end',
})

function BannerXButton({ handleClose }: { handleClose: () => void }) {
  return (
    <Flex row centered position="absolute" right={8} top={8} zIndex={zIndexes.mask}>
      <IconButton
        size="xxsmall"
        emphasis="secondary"
        onPress={(e) => {
          e.stopPropagation()
          handleClose()
        }}
        icon={<X />}
        p={3}
        scale={0.8}
      />
    </Flex>
  )
}

interface BannerTemplateProps {
  backgroundImageUrl?: string
  iconUrl?: string
  title: string
  subtitle?: string
  onClose: () => void
  onPress?: () => void
  children?: ReactNode
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
  iconUrl,
  title,
  subtitle,
  onClose,
  onPress,
  children,
}: BannerTemplateProps) {
  return (
    <BannerContainer onPress={onPress} pointerEvents="auto">
      <BannerXButton handleClose={onClose} />

      {backgroundImageUrl && <GradientBackground backgroundImage={`url(${backgroundImageUrl})`} />}

      <ContentWrapper>
        {iconUrl && <IconContainer backgroundImage={`url(${iconUrl})`} />}

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
      </ContentWrapper>
    </BannerContainer>
  )
}
