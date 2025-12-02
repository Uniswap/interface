import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'
import { TouchableArea } from 'ui/src/components/touchable'
import { useSporeColorsForTheme } from 'ui/src/hooks/useSporeColors'
import {
  renderSnowflakesNative,
  SnowflakeContainer,
} from 'uniswap/src/components/banners/shared/SharedSnowflakeComponents'
import { UniswapWrapped2025CardProps } from 'uniswap/src/components/banners/UniswapWrapped2025Card/types'
import { useSnowflakeAnimation } from 'uniswap/src/hooks/useSnowflakeAnimation'

const CARD_HEIGHT = 82

export function UniswapWrapped2025Card({ onPress }: UniswapWrapped2025CardProps): JSX.Element {
  const { t } = useTranslation()
  const { snowflakes, removeSnowflake } = useSnowflakeAnimation()
  const darkColors = useSporeColorsForTheme('dark')

  return (
    <TouchableArea width="100%" onPress={onPress}>
      <Flex
        position="relative"
        borderRadius="$rounded20"
        overflow="hidden"
        shadowColor="rgba(77, 10, 79, 0.43)"
        shadowOffset={{ width: 0, height: 6 }}
        shadowRadius={12}
        borderWidth={1}
        borderColor={darkColors.surface3.val}
        height={CARD_HEIGHT}
        p="$spacing20"
        justifyContent="center"
      >
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
            borderRadius: 20,
          }}
        />
        <Text color={darkColors.neutral1.val} variant="buttonLabel2">
          {t('home.banner.uniswapWrapped2025.title')}
        </Text>
        <Text color="$pinkLight" variant="body3">
          {t('home.banner.uniswapWrapped2025.subtitle')}
        </Text>

        <SnowflakeContainer>
          {renderSnowflakesNative({
            snowflakes,
            containerHeight: CARD_HEIGHT,
            removeSnowflake,
            keyPrefix: 'card',
          })}
        </SnowflakeContainer>
      </Flex>
    </TouchableArea>
  )
}
