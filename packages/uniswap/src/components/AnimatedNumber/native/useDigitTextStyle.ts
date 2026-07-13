import { useMemo } from 'react'
import { Platform } from 'react-native'
import type { TextStyle } from 'react-native'
import { fonts } from 'ui/src/theme'
import type { ResolvedFontStyle } from 'ui/src/theme'
import { DIGIT_CELL_PADDING_RATIO } from 'uniswap/src/components/AnimatedNumber/native/constants'

/** Fixed (tabular) width for a single digit cell so layout stays deterministic across digit changes. */
export function getDigitCellWidth(maxDigitWidthScaled: number): number {
  return maxDigitWidthScaled + maxDigitWidthScaled * DIGIT_CELL_PADDING_RATIO
}

export function getNativeAnimatedDigitTextStyle({
  variantFont,
  digitHeight,
  useHeadingTypography,
}: {
  variantFont: ResolvedFontStyle
  digitHeight: number
  useHeadingTypography: boolean
}): TextStyle {
  return {
    fontSize: variantFont.fontSize,
    fontWeight: (useHeadingTypography ? '500' : variantFont.fontWeight) as TextStyle['fontWeight'],
    lineHeight: variantFont.lineHeight,
    top: 1,
    height: digitHeight,
    fontFamily: useHeadingTypography ? fonts.buttonLabel1.family : variantFont.family,
    ...(Platform.OS === 'android' && !useHeadingTypography ? { includeFontPadding: false } : {}),
  }
}

export function useDigitTextStyle({
  variantFont,
  digitHeight,
  useHeadingTypography,
}: {
  variantFont: ResolvedFontStyle
  digitHeight: number
  useHeadingTypography: boolean
}): TextStyle {
  return useMemo(
    () => getNativeAnimatedDigitTextStyle({ variantFont, digitHeight, useHeadingTypography }),
    [variantFont, digitHeight, useHeadingTypography],
  )
}
