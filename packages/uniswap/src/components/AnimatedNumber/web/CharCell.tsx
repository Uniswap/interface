import { Text } from 'ui/src'
import type { ResolvedFontStyle, TextVariantKey } from 'ui/src/theme'
import { AnimatedNumberDirection } from 'uniswap/src/components/AnimatedNumber/types'
import { isDigitChar } from 'uniswap/src/components/AnimatedNumber/utils/computeCharsSizes'
import { getCharDisplayColor } from 'uniswap/src/components/AnimatedNumber/utils/getCharDisplayColor'
import { DigitSlot } from 'uniswap/src/components/AnimatedNumber/web/DigitSlot'
import type { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'

/** Matches TopAndBottomGradient fade stops; applied per digit rail so punctuation stays clear. */
const DIGIT_EDGE_MASK_STYLE: React.CSSProperties = {
  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
  maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
}

export function CharCell({
  index,
  chars,
  currency,
  commonPrefixLength,
  nextColor,
  baseColor,
  decimalPartColor,
  shouldFadeDecimals,
  reduceMotion,
  dir,
  delay,
  digitHeight,
  textVariantKey,
  variantFont,
  maxDigitWidthScaled,
  animateGen,
  shouldForceAnimate,
  showEdgeFade,
}: {
  index: number
  chars: string[]
  currency: FiatCurrencyInfo
  commonPrefixLength: number
  nextColor?: string
  baseColor: string
  decimalPartColor: string
  shouldFadeDecimals: boolean
  reduceMotion: boolean
  dir: AnimatedNumberDirection
  delay: number
  digitHeight: number
  textVariantKey: TextVariantKey
  variantFont: ResolvedFontStyle
  maxDigitWidthScaled: number
  animateGen: number
  shouldForceAnimate: boolean
  showEdgeFade: boolean
}): JSX.Element {
  const digit = chars[index]
  const color = getCharDisplayColor({
    index,
    chars,
    decimalSeparator: currency.decimalSeparator,
    shouldFadeDecimals,
    commonPrefixLength,
    nextColor,
    neutral1Color: baseColor,
    fadedDecimalColor: decimalPartColor,
  })

  if (digit && isDigitChar(digit)) {
    const width = maxDigitWidthScaled + maxDigitWidthScaled / 10
    return (
      <span
        style={{
          display: 'inline-block',
          height: digitHeight,
          overflow: 'hidden',
          verticalAlign: 'top',
          ...(showEdgeFade ? DIGIT_EDGE_MASK_STYLE : {}),
        }}
      >
        <DigitSlot
          color={color}
          delay={delay}
          digit={digit}
          digitHeight={digitHeight}
          dir={dir}
          reduceMotion={reduceMotion}
          triggerGen={shouldForceAnimate ? animateGen : undefined}
          variantFont={variantFont}
          width={width}
        />
      </span>
    )
  }

  return (
    <Text
      allowFontScaling={false}
      variant={textVariantKey}
      style={{
        color,
        height: digitHeight,
        display: 'inline-block',
        transition: reduceMotion ? 'none' : 'color 250ms ease',
      }}
    >
      {digit}
    </Text>
  )
}
