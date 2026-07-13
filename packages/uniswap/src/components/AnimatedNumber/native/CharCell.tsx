import { useEffect } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import type { ResolvedFontStyle } from 'ui/src/theme'
import { DigitSlot } from 'uniswap/src/components/AnimatedNumber/native/DigitSlot'
import { useDigitTextStyle } from 'uniswap/src/components/AnimatedNumber/native/useDigitTextStyle'
import { AnimatedCharStyles } from 'uniswap/src/components/AnimatedNumber/styles'
import { TopAndBottomGradient } from 'uniswap/src/components/AnimatedNumber/TopAndBottomGradient/TopAndBottomGradient'
import { AnimatedNumberDirection } from 'uniswap/src/components/AnimatedNumber/types'
import { isDigitChar } from 'uniswap/src/components/AnimatedNumber/utils/computeCharsSizes'
import { getCharBaseColor, getCharDisplayColor } from 'uniswap/src/components/AnimatedNumber/utils/getCharDisplayColor'
import type { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'

export const CharCell = ({
  index,
  chars,
  currency,
  commonPrefixLength,
  nextColor,
  baseColor,
  decimalPartColor,
  shouldFadeDecimals,
  digitHeight,
  digitCellWidth,
  variantFont,
  useHeadingTypography,
  dir,
  delay,
  shouldForceAnimate,
  animateGen,
  reduceMotion,
}: {
  index: number
  chars: string[]
  currency: FiatCurrencyInfo
  commonPrefixLength: number
  nextColor?: string
  baseColor: string
  decimalPartColor: string
  shouldFadeDecimals: boolean
  digitHeight: number
  digitCellWidth: number
  variantFont: ResolvedFontStyle
  useHeadingTypography: boolean
  dir: AnimatedNumberDirection
  delay: number
  shouldForceAnimate: boolean
  animateGen: number
  reduceMotion: boolean
}): JSX.Element => {
  const char = chars[index]
  const isDigit = char != null && isDigitChar(char)

  // Non-digit color animation (hooks always called; value only used for non-digit branch)
  const charBaseColor = getCharBaseColor({
    index,
    chars,
    decimalSeparator: currency.decimalSeparator,
    shouldFadeDecimals,
    neutral1Color: baseColor,
    fadedDecimalColor: decimalPartColor,
  })
  const nonDigitFontColor = useSharedValue(charBaseColor)
  const digitTextStyle = useDigitTextStyle({ variantFont, digitHeight, useHeadingTypography })

  useEffect(() => {
    const finishColor = getCharBaseColor({
      index,
      chars,
      decimalSeparator: currency.decimalSeparator,
      shouldFadeDecimals,
      neutral1Color: baseColor,
      fadedDecimalColor: decimalPartColor,
    })
    if (nextColor && index >= commonPrefixLength) {
      nonDigitFontColor.value = withSequence(
        withTiming(nextColor, { duration: 250 }),
        withDelay(50, withTiming(finishColor, { duration: 310 })),
      )
    } else {
      nonDigitFontColor.value = withTiming(finishColor, { duration: 250 })
    }
  }, [
    nextColor,
    index,
    commonPrefixLength,
    baseColor,
    decimalPartColor,
    shouldFadeDecimals,
    chars,
    currency.decimalSeparator,
    nonDigitFontColor,
  ])

  const animatedNonDigitStyle = useAnimatedStyle(() => ({
    color: nonDigitFontColor.value,
  }))

  if (isDigit) {
    const digitColor = getCharDisplayColor({
      index,
      chars,
      decimalSeparator: currency.decimalSeparator,
      shouldFadeDecimals,
      commonPrefixLength,
      nextColor,
      neutral1Color: baseColor,
      fadedDecimalColor: decimalPartColor,
    })

    return (
      <Animated.View
        style={[{ height: digitHeight, width: digitCellWidth, alignItems: 'center' }, AnimatedCharStyles.wrapperStyle]}
      >
        <DigitSlot
          color={digitColor}
          delay={delay}
          digit={char}
          digitHeight={digitHeight}
          dir={dir}
          reduceMotion={reduceMotion}
          triggerGen={shouldForceAnimate ? animateGen : undefined}
          useHeadingTypography={useHeadingTypography}
          variantFont={variantFont}
        />
        <TopAndBottomGradient height={digitHeight} />
      </Animated.View>
    )
  }

  return (
    <Animated.Text allowFontScaling={false} style={[digitTextStyle, animatedNonDigitStyle]}>
      {char}
    </Animated.Text>
  )
}
