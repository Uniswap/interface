import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Gift } from 'ui/src/components/icons/Gift'
import { X } from 'ui/src/components/icons/X'
import { Flex } from 'ui/src/components/layout'
import { useSporeColorsForTheme } from 'ui/src/hooks/useSporeColors'
import { styled, Text, TouchableArea } from 'ui/src/index'
import {
  MouseGlow,
  renderSnowflakesWeb,
  SnowflakeContainer,
} from 'uniswap/src/components/banners/shared/SharedSnowflakeComponents'
import { UniswapWrapped2025BannerProps } from 'uniswap/src/components/banners/UniswapWrapped2025Banner/types'
import { useSnowflakeAnimation } from 'uniswap/src/hooks/useSnowflakeAnimation'
import { isExtensionApp } from 'utilities/src/platform'

const BannerWrapper = styled(Flex, {
  width: '100%',
  position: 'relative',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  zIndex: '$sticky',
  row: true,
  cursor: 'pointer',
})

const GradientBackground = styled(Flex, {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(180deg, #131313 0%, #3A123B 38.56%)',
  height: 96,
})

const GlowEffect = styled(Flex, {
  position: 'absolute',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  top: '120%',
  width: '80%',
  height: 27,
  background: '#fc74fe',
  borderRadius: '$rounded32',
  filter: 'blur(28px)',
  opacity: 0.6,
})

const Badge = styled(Flex, {
  background: 'rgba(253, 175, 240, 0.16)',
  borderRadius: '$rounded6',
  px: '$spacing6',
  py: '$spacing2',
  backdropFilter: 'blur(4px)',
  $sm: {
    display: 'none',
  },
})

// using a custom animation as Tamagui preset was very laggy
const RisingTextContainer = styled(Flex, {
  position: 'relative',
  opacity: 0,
  width: '100%',
  p: '$spacing16',
  transform: 'translateY(20px)',
  transition: 'opacity 300ms ease-out 300ms, transform 300ms ease-out 300ms',
  variants: {
    visible: {
      true: {
        opacity: 1,
        transform: 'translateY(0)',
      },
    },
  },
})

const MOUSE_WAKE_RADIUS = 120

export function UniswapWrapped2025Banner({
  handleDismiss,
  handlePress,
  bannerHeight = 56,
}: UniswapWrapped2025BannerProps): JSX.Element {
  const { t } = useTranslation()
  const [isTextVisible, setIsTextVisible] = useState(false)
  const darkColors = useSporeColorsForTheme('dark')
  const [bannerWidth, setBannerWidth] = useState<number>(0)

  useEffect(() => {
    setIsTextVisible(true)
  }, [])

  const { snowflakes, removeSnowflake, mouseInteraction } = useSnowflakeAnimation({
    enabled: true,
    containerWidth: bannerWidth,
  })

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect()
    setBannerWidth(rect.width)
    mouseInteraction?.handleMouseMove(event)
  }

  return (
    // biome-ignore lint/correctness/noRestrictedElements: Web-only mouse tracking for glow effect
    <div
      style={{ position: 'relative', width: '100%' }}
      onMouseLeave={mouseInteraction?.handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <BannerWrapper height={bannerHeight} onPress={handlePress}>
        <GradientBackground />
        <GlowEffect />
        {/* Mouse-following glow effect */}
        {mouseInteraction?.mousePosition && (
          <MouseGlow
            width={isExtensionApp ? MOUSE_WAKE_RADIUS / 2 : MOUSE_WAKE_RADIUS}
            height={isExtensionApp ? MOUSE_WAKE_RADIUS / 2 : MOUSE_WAKE_RADIUS}
            style={{
              left: mouseInteraction.mousePosition.x - (isExtensionApp ? MOUSE_WAKE_RADIUS / 4 : MOUSE_WAKE_RADIUS / 2), // Center the glow on cursor (width/2)
              top: mouseInteraction.mousePosition.y - (isExtensionApp ? MOUSE_WAKE_RADIUS / 4 : MOUSE_WAKE_RADIUS / 2), // Center the glow on cursor (height/2)
            }}
          />
        )}
        <SnowflakeContainer>
          {renderSnowflakesWeb({
            snowflakes,
            containerHeight: bannerHeight,
            removeSnowflake,
            getSnowflakeDrift: mouseInteraction?.getSnowflakeDrift,
            keyPrefix: 'banner',
          })}
        </SnowflakeContainer>
        <RisingTextContainer
          row={!isExtensionApp}
          centered={!isExtensionApp}
          gap={isExtensionApp ? '$spacing4' : '$spacing8'}
          visible={isTextVisible}
        >
          <Flex row={!isExtensionApp} centered={!isExtensionApp} gap={isExtensionApp ? '$spacing4' : '$spacing8'}>
            {!isExtensionApp && <Gift color={darkColors.neutral1.val} size="$icon.20" />}
            <Text variant="buttonLabel3" color={darkColors.neutral1.val}>
              {t('home.banner.uniswapWrapped2025.title')}
            </Text>
          </Flex>
          {isExtensionApp ? (
            <Text variant="body4" color="$pinkLight">
              {t('home.banner.uniswapWrapped2025.subtitle')}
            </Text>
          ) : (
            <Badge>
              <Text variant="body4" color="$pinkLight">
                {t('home.banner.uniswapWrapped2025.subtitle')}
              </Text>
            </Badge>
          )}
        </RisingTextContainer>
        <TouchableArea
          centered
          top={isExtensionApp ? 16 : undefined}
          position="absolute"
          right={isExtensionApp ? '$spacing16' : '$spacing20'}
          p={isExtensionApp ? '$spacing4' : 0}
          backgroundColor={isExtensionApp ? darkColors.surface3.val : 'transparent'}
          borderRadius="$roundedFull"
          backdropFilter="blur(4px)"
          onPress={handleDismiss}
        >
          <X size={isExtensionApp ? '$icon.16' : '$icon.20'} color={darkColors.neutral1.val} />
        </TouchableArea>
      </BannerWrapper>
    </div>
  )
}
