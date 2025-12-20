import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { RefObject, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, styled, Text, useWindowDimensions } from 'ui/src'
import { Gift } from 'ui/src/components/icons/Gift'
import { useSporeColorsForTheme } from 'ui/src/hooks/useSporeColors'
import {
  MouseGlow,
  renderSnowflakesWeb,
  SnowflakeContainer,
} from 'uniswap/src/components/banners/shared/SharedSnowflakeComponents'
import { useSnowflakeAnimation } from 'uniswap/src/hooks/useSnowflakeAnimation'
import { isMobileWeb } from 'utilities/src/platform'

const DisconnectedContainer = styled(Flex, {
  width: '100%',
  height: '100%',
  position: 'relative',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
})

const GradientBackground = styled(Flex, {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(180deg, #131313 0%, #3A123B 100%)',
})

const GlowEffect = styled(Flex, {
  position: 'absolute',
  left: 0,
  bottom: 0,
  width: '100%',
  height: 30,
  background: '#fc74fe',
  filter: 'blur(90px)',
  opacity: 0.4,
})

const IconWrapper = styled(Flex, {
  width: 64,
  height: 64,
  borderRadius: '$rounded20',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(8px)',
  alignItems: 'center',
  justifyContent: 'center',
})

export function DisconnectedState({ parentRef }: { parentRef: RefObject<HTMLDivElement | null> }): JSX.Element {
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const [containerHeight, setContainerHeight] = useState<number>(0)
  const { open: openAccountDrawer } = useAccountDrawer()
  const { t } = useTranslation()
  const darkColors = useSporeColorsForTheme('dark')
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()

  // set initital container height and width
  useEffect(() => {
    const rect = parentRef.current?.getBoundingClientRect()
    setContainerWidth(rect?.width ?? windowWidth * 0.8)
    setContainerHeight(rect?.height ?? windowHeight * 0.8)
  }, [parentRef, windowWidth, windowHeight])

  const { snowflakes, removeSnowflake, mouseInteraction } = useSnowflakeAnimation(
    {
      enabled: !isMobileWeb,
      containerWidth,
      bannerHeight: containerHeight,
    },
    0.5,
  )

  return (
    // biome-ignore lint/correctness/noRestrictedElements: Web-only mouse tracking for glow effect
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: darkColors.surface1.val,
      }}
      onMouseLeave={mouseInteraction?.handleMouseLeave}
      onMouseMove={mouseInteraction?.handleMouseMove}
    >
      <DisconnectedContainer backgroundColor={darkColors.surface1.val}>
        <GradientBackground />
        <GlowEffect />

        {/* Mouse-following glow effect */}
        {mouseInteraction?.mousePosition && (
          <MouseGlow
            width={120}
            height={120}
            style={{
              left: mouseInteraction.mousePosition.x - 60,
              top: mouseInteraction.mousePosition.y - 60,
            }}
          />
        )}

        <SnowflakeContainer>
          {renderSnowflakesWeb({
            snowflakes,
            containerHeight,
            removeSnowflake,
            getSnowflakeDrift: mouseInteraction?.getSnowflakeDrift,
            keyPrefix: 'wrapped-disconnected',
          })}
        </SnowflakeContainer>

        <Flex centered gap="$spacing32" p="$spacing24">
          <IconWrapper>
            <Gift color={darkColors.neutral1.val} size={32} />
          </IconWrapper>

          <Flex alignItems="center" gap="$spacing12">
            <Text variant="heading3" color={darkColors.neutral1.val}>
              {t('home.banner.uniswapWrapped2025.title')}
            </Text>

            <Text color={darkColors.neutral2.val} variant="body1" textAlign="center">
              {t('home.banner.uniswapWrapped2025.description')}
            </Text>
          </Flex>
          <Flex row centered>
            <Button
              variant="default"
              emphasis="primary"
              backgroundColor={darkColors.neutral1.val}
              size="medium"
              onPress={openAccountDrawer}
            >
              <Text px="$spacing20" color={darkColors.surface1.val} variant="buttonLabel1">
                {t('common.button.connect')}
              </Text>
            </Button>
          </Flex>
        </Flex>
      </DisconnectedContainer>
    </div>
  )
}
