import { useMemo } from 'react'
import Animated from 'react-native-reanimated'
import { useSporeColors } from 'ui/src'
import { getTextVariantKey } from 'ui/src/theme'
import type { AnimatedNumberProps } from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { useResolvedAnimatedNumberColors } from 'uniswap/src/components/AnimatedNumber/hooks/useResolvedAnimatedNumberColors'
import { HEADING_TEXT_VARIANT_KEYS } from 'uniswap/src/components/AnimatedNumber/native/constants'
import { AnimatedFontStyles, StaticNumberStyles } from 'uniswap/src/components/AnimatedNumber/native/styles'
import type { ReanimatedNumberProps } from 'uniswap/src/components/AnimatedNumber/native/types'
import { useDigitTextStyle } from 'uniswap/src/components/AnimatedNumber/native/useDigitTextStyle'
import { getAnimatedNumberVariantMetrics } from 'uniswap/src/components/AnimatedNumber/utils/getAnimatedNumberVariantMetrics'

export const StaticNumber = ({
  containerTestID,
  currency,
  shouldFadeDecimals = false,
  textVariant = '$heading2',
  value,
  color,
}: Pick<ReanimatedNumberProps, 'currency' | 'shouldFadeDecimals' | 'textVariant' | 'value' | 'color'> &
  Pick<AnimatedNumberProps, 'containerTestID'>): JSX.Element => {
  const colors = useSporeColors()
  const { baseColor, decimalPartColor } = useResolvedAnimatedNumberColors({
    colors,
    color,
    shouldFadeDecimals,
  })
  const amountOfCurrency = value?.split(currency.decimalSeparator)
  const { digitHeight, variantFont } = useMemo(() => getAnimatedNumberVariantMetrics(textVariant), [textVariant])
  const useHeadingTypography = HEADING_TEXT_VARIANT_KEYS.has(getTextVariantKey(textVariant))
  const digitTextStyle = useDigitTextStyle({ variantFont, digitHeight, useHeadingTypography })

  // Keep the static path on native text primitives. On Android, routing this
  // through Tamagui Text uses different font metrics/padding and can introduce clipping.
  return (
    <Animated.Text
      allowFontScaling={false}
      testID={containerTestID}
      style={[
        useHeadingTypography ? AnimatedFontStyles.fontStyle : null,
        useHeadingTypography ? StaticNumberStyles.fontStyle : null,
        digitTextStyle,
        {
          color: baseColor,
        },
      ]}
    >
      {shouldFadeDecimals && amountOfCurrency?.length === 2 ? amountOfCurrency[0] : value}
      {shouldFadeDecimals && amountOfCurrency?.length === 2 && (
        <Animated.Text
          allowFontScaling={false}
          style={[
            useHeadingTypography ? AnimatedFontStyles.fontStyle : null,
            useHeadingTypography ? StaticNumberStyles.fontStyle : null,
            digitTextStyle,
            {
              color: decimalPartColor,
            },
          ]}
        >
          {currency.decimalSeparator}
          {amountOfCurrency[1]}
        </Animated.Text>
      )}
    </Animated.Text>
  )
}
