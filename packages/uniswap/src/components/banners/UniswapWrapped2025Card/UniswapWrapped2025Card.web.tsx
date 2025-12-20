import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src/components/layout'
import { useSporeColorsForTheme } from 'ui/src/hooks/useSporeColors'
import { styled, Text, TouchableArea } from 'ui/src/index'
import {
  MouseGlow,
  renderSnowflakesWeb,
  SnowflakeContainer,
} from 'uniswap/src/components/banners/shared/SharedSnowflakeComponents'
import { UniswapWrapped2025CardProps } from 'uniswap/src/components/banners/UniswapWrapped2025Card/types'
import { useSnowflakeAnimation } from 'uniswap/src/hooks/useSnowflakeAnimation'

const CARD_HEIGHT = 80

const GradientBackground = styled(Flex, {
  background: 'linear-gradient(180deg, #151315 0%, #432344 34.5%, #6A306C 80.76%, #952996 100%)',
  borderRadius: '$rounded20',
  p: '$spacing20',
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

export function UniswapWrapped2025Card({ onPress }: UniswapWrapped2025CardProps): JSX.Element {
  const { t } = useTranslation()
  const darkColors = useSporeColorsForTheme('dark')
  const [cardWidth, setCardWidth] = useState<number>(0)

  const { snowflakes, removeSnowflake, mouseInteraction } = useSnowflakeAnimation({
    enabled: true,
    containerWidth: cardWidth,
    bannerHeight: CARD_HEIGHT,
  })

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect()
    setCardWidth(rect.width)
    mouseInteraction?.handleMouseMove(event)
  }

  return (
    // biome-ignore lint/correctness/noRestrictedElements: Web-only mouse tracking for glow effect
    <div
      style={{ position: 'relative', width: '100%' }}
      onMouseLeave={mouseInteraction?.handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <TouchableArea onPress={onPress}>
        <Flex
          position="relative"
          borderRadius="$rounded20"
          overflow="hidden"
          boxShadow="-2px -3px 6px 0 rgba(255, 255, 255, 0.22) inset, 0 2px 5px -2px rgba(18, 18, 23, 0.03)"
          borderWidth={1}
          borderColor={darkColors.surface3.val}
          height={CARD_HEIGHT}
        >
          <GradientBackground>
            <Text color={darkColors.neutral1.val} variant="buttonLabel2">
              {t('home.banner.uniswapWrapped2025.title')}
            </Text>
            <Text color="$pinkLight" variant="body3">
              {t('home.banner.uniswapWrapped2025.subtitle')}
            </Text>
          </GradientBackground>
          <GlowEffect />
          {/* Mouse-following glow effect */}
          {mouseInteraction?.mousePosition && (
            <MouseGlow
              width={60}
              height={60}
              style={{
                left: mouseInteraction.mousePosition.x - 30, // Center the glow on cursor (width/2)
                top: mouseInteraction.mousePosition.y - 30, // Center the glow on cursor (height/2)
              }}
            />
          )}
          <SnowflakeContainer>
            {renderSnowflakesWeb({
              snowflakes,
              containerHeight: CARD_HEIGHT,
              removeSnowflake,
              getSnowflakeDrift: mouseInteraction?.getSnowflakeDrift,
              keyPrefix: 'card',
            })}
          </SnowflakeContainer>
        </Flex>
      </TouchableArea>
    </div>
  )
}
