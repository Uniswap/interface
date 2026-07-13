import Animated from 'react-native-reanimated'
import { Flex, Shine } from 'ui/src'
import type { AnimatedNumberProps } from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { CharRow } from 'uniswap/src/components/AnimatedNumber/native/CharRow'
import { CHAR_SPACE_SIZE } from 'uniswap/src/components/AnimatedNumber/native/constants'
import { AnimatedFontStyles } from 'uniswap/src/components/AnimatedNumber/native/styles'
import type { ReanimatedNumberRenderProps } from 'uniswap/src/components/AnimatedNumber/native/types'

export const CompactReanimatedNumber = ({
  alignRight,
  baseColor,
  balanceChangeColor,
  chars,
  commonPrefixLength,
  containerTestID,
  currency,
  decimalPartColor,
  digitCellWidth,
  digitHeight,
  EndElement,
  endElementGap,
  shouldFadeDecimals,
  useHeadingTypography,
  value,
  variantFont,
  warmLoading,
  dir,
  charDelays,
  charShouldAnimate,
  animateGen,
  reduceMotion,
}: ReanimatedNumberRenderProps &
  Pick<
    AnimatedNumberProps,
    'EndElement' | 'alignRight' | 'containerTestID' | 'endElementGap' | 'value' | 'warmLoading'
  >): JSX.Element => {
  // Natural flex flow: the row sizes itself to the digit cells + separators, so the container
  // always matches the content width exactly without any measurement or fixed phantom width.
  return (
    <Flex row justifyContent={alignRight ? 'flex-end' : 'flex-start'} alignItems="flex-start" testID={containerTestID}>
      <Shine disabled={!warmLoading}>
        <Flex row style={{ position: 'relative' }}>
          <CharRow
            animateGen={animateGen}
            balanceChangeColor={balanceChangeColor}
            baseColor={baseColor}
            charDelays={charDelays}
            chars={chars}
            charShouldAnimate={charShouldAnimate}
            commonPrefixLength={commonPrefixLength}
            currency={currency}
            decimalPartColor={decimalPartColor}
            digitCellWidth={digitCellWidth}
            digitHeight={digitHeight}
            dir={dir}
            reduceMotion={reduceMotion}
            shouldFadeDecimals={shouldFadeDecimals}
            useHeadingTypography={useHeadingTypography}
            variantFont={variantFont}
          />
          {/* Keeps the screen-reader/copy value intact since the visible chars are split into cells. */}
          <Animated.Text allowFontScaling={false} style={AnimatedFontStyles.invisible}>
            {value}
          </Animated.Text>
        </Flex>
      </Shine>
      {EndElement && (
        <Flex height={digitHeight} justifyContent="center" style={{ marginLeft: endElementGap ?? CHAR_SPACE_SIZE }}>
          {EndElement}
        </Flex>
      )}
    </Flex>
  )
}
