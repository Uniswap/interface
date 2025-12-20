import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { X } from 'ui/src/components/icons/X'
import { Flex } from 'ui/src/components/layout'
import { useSporeColorsForTheme } from 'ui/src/hooks/useSporeColors'
import { styled, Text, TouchableArea } from 'ui/src/index'
import {
  renderSnowflakesNative,
  SnowflakeContainer,
} from 'uniswap/src/components/banners/shared/SharedSnowflakeComponents'
import { UniswapWrapped2025BannerProps } from 'uniswap/src/components/banners/UniswapWrapped2025Banner/types'
import { useSnowflakeAnimation } from 'uniswap/src/hooks/useSnowflakeAnimation'

const BannerWrapper = styled(Flex, {
  width: '100%',
  position: 'relative',
  px: '$spacing20',
  py: '$spacing24',
  overflow: 'hidden',
  zIndex: '$sticky',
})

export function UniswapWrapped2025Banner({
  handleDismiss,
  handlePress,
  bannerHeight = 116,
}: UniswapWrapped2025BannerProps): JSX.Element {
  const { t } = useTranslation()
  const { snowflakes, removeSnowflake } = useSnowflakeAnimation()
  const darkColors = useSporeColorsForTheme('dark')

  return (
    <TouchableArea onPress={handlePress}>
      <BannerWrapper height={bannerHeight}>
        <LinearGradient
          colors={['#151315', '#432344', '#6A306C', '#952996']}
          locations={[0, 0.345, 0.8076, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            padding: 20,
          }}
        />

        <SnowflakeContainer>
          {renderSnowflakesNative({
            snowflakes,
            containerHeight: bannerHeight,
            removeSnowflake,
            keyPrefix: 'banner',
          })}
        </SnowflakeContainer>

        <Flex justifyContent="flex-start" gap="$spacing2">
          <Text variant="buttonLabel2" color={darkColors.neutral1.val}>
            {t('home.banner.uniswapWrapped2025.title')}
          </Text>
          <Text variant="body3" color="$pinkLight">
            {t('home.banner.uniswapWrapped2025.subtitle')}
          </Text>
        </Flex>

        <TouchableArea
          centered
          position="absolute"
          right="$spacing24"
          top="$spacing24"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          p="$spacing4"
          backgroundColor={darkColors.surface3.val}
          borderRadius="$roundedFull"
          backdropFilter="blur(4px)"
          onPress={handleDismiss}
        >
          <X size={16} color={darkColors.neutral1.val} />
        </TouchableArea>
      </BannerWrapper>
    </TouchableArea>
  )
}
