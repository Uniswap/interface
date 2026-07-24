import type { FontVariantToken, ResolvedFontStyle } from 'ui/src/theme'
import { fonts, getFontStylesForVariant } from 'ui/src/theme'
import { NUMBER_WIDTH_ARRAY } from 'uniswap/src/components/AnimatedNumber/utils/constants'

export type AnimatedNumberVariantMetrics = {
  variantFont: ResolvedFontStyle
  digitHeight: number
  numberWidthArrayScaled: number[]
  maxDigitWidthScaled: number
}

export function getAnimatedNumberVariantMetrics(textVariant: FontVariantToken): AnimatedNumberVariantMetrics {
  const variantFont = getFontStylesForVariant(textVariant)
  const numberWidthArrayScaled = NUMBER_WIDTH_ARRAY.map(
    (width) => width * (variantFont.fontSize / fonts.heading1.fontSize),
  )

  return {
    variantFont,
    digitHeight: variantFont.lineHeight,
    numberWidthArrayScaled,
    maxDigitWidthScaled: Math.max(...numberWidthArrayScaled),
  }
}
