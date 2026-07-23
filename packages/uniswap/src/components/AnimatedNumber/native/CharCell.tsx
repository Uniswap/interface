import { Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import type { ResolvedFontStyle } from 'ui/src/theme'
import { DigitSlot } from 'uniswap/src/components/AnimatedNumber/native/DigitSlot'
import { startFlashSequence } from 'uniswap/src/components/AnimatedNumber/native/startFlashSequence'
import type { AnimatedNumberTick } from 'uniswap/src/components/AnimatedNumber/native/types'
import { useDigitTextStyle } from 'uniswap/src/components/AnimatedNumber/native/useDigitTextStyle'
import { useOnTick } from 'uniswap/src/components/AnimatedNumber/native/useOnTick'
import { AnimatedCharStyles } from 'uniswap/src/components/AnimatedNumber/styles'
import { isDigitChar } from 'uniswap/src/components/AnimatedNumber/utils/computeCharsSizes'
import { getCharBaseColor } from 'uniswap/src/components/AnimatedNumber/utils/getCharDisplayColor'
import type { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'

const overlayStyle = { position: 'absolute', top: 0, left: 0 } as const

export const CharCell = ({
  index,
  chars,
  currency,
  tick,
  baseColor,
  decimalPartColor,
  shouldFadeDecimals,
  digitHeight,
  digitCellWidth,
  variantFont,
  useHeadingTypography,
  delay,
  shouldForceAnimate,
  reduceMotion,
}: {
  index: number
  chars: string[]
  currency: FiatCurrencyInfo
  tick: AnimatedNumberTick
  baseColor: string
  decimalPartColor: string
  shouldFadeDecimals: boolean
  digitHeight: number
  digitCellWidth: number
  variantFont: ResolvedFontStyle
  useHeadingTypography: boolean
  delay: number
  shouldForceAnimate: boolean
  reduceMotion: boolean
}): JSX.Element => {
  const char = chars[index]
  const isDigit = char != null && isDigitChar(char)

  const charBaseColor = getCharBaseColor({
    index,
    chars,
    decimalSeparator: currency.decimalSeparator,
    shouldFadeDecimals,
    neutral1Color: baseColor,
    fadedDecimalColor: decimalPartColor,
  })
  const isInChangedSuffix = index >= tick.commonPrefixLength
  const flashColor = isInChangedSuffix ? tick.flashColor : undefined

  // Cells keep identity by position from the END of the value, so the outgoing glyph for this
  // cell lives at the same end-relative position in the previous value's chars.
  const prevIndex = tick.prevChars.length - (chars.length - index)
  const prevChar = tick.prevChars[prevIndex]

  // Non-digit flash (hooks always called; only used by the non-digit branch). Same
  // once-per-tick trigger as DigitSlot so a tick can never flash twice.
  const nonDigitFlashOpacity = useSharedValue(0)
  const digitTextStyle = useDigitTextStyle({ variantFont, digitHeight, useHeadingTypography })

  useOnTick(tick.gen, () => {
    if (flashColor != null) {
      startFlashSequence(nonDigitFlashOpacity)
    }
  })

  const animatedNonDigitFlashStyle = useAnimatedStyle(() => ({
    opacity: nonDigitFlashOpacity.value,
  }))

  if (isDigit) {
    // Roll when this cell's glyph changed, or when it sits in the changed suffix (same-digit
    // cells there roll too, matching the shipped design).
    const digitChanged = prevChar !== undefined && prevChar !== char
    return (
      <View
        style={[{ height: digitHeight, width: digitCellWidth, alignItems: 'center' }, AnimatedCharStyles.wrapperStyle]}
      >
        <DigitSlot
          baseColor={charBaseColor}
          delay={delay}
          digit={char}
          digitHeight={digitHeight}
          dir={tick.dir}
          flashColor={flashColor}
          gen={tick.gen}
          prevDigit={prevChar !== undefined && isDigitChar(prevChar) ? prevChar : char}
          reduceMotion={reduceMotion}
          shouldRoll={digitChanged || shouldForceAnimate}
          useHeadingTypography={useHeadingTypography}
          variantFont={variantFont}
        />
      </View>
    )
  }

  // Static glyph + flash overlay: the flash cross-fades a same-glyph copy in the indication
  // color via opacity, so no `color` prop is ever animated (a per-frame commit under Fabric).
  return (
    <View>
      <Text accessible={false} allowFontScaling={false} style={[digitTextStyle, { color: charBaseColor }]}>
        {char}
      </Text>
      <Animated.Text
        accessibilityElementsHidden
        accessible={false}
        allowFontScaling={false}
        importantForAccessibility="no-hide-descendants"
        style={[digitTextStyle, { color: flashColor ?? charBaseColor }, overlayStyle, animatedNonDigitFlashStyle]}
      >
        {char}
      </Animated.Text>
    </View>
  )
}
