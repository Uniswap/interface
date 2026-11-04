import type { ResolvedFontStyle } from '@universe/mycelium'

/** Fixed (tabular) width of a digit cell. The copy overlay sizes its characters with it to line up with the visible cells. */
export function getDigitCellWidth(maxDigitWidthScaled: number): number {
  return maxDigitWidthScaled + maxDigitWidthScaled / 10
}

/** Typography shared by the visible digits and the copy overlay, so the selection highlight stays on the glyphs. */
export function getDigitTextStyle({
  variantFont,
  digitHeight,
}: {
  variantFont: ResolvedFontStyle
  digitHeight: number
}): React.CSSProperties {
  return {
    fontSize: variantFont.fontSize,
    fontWeight: variantFont.fontWeight,
    lineHeight: `${digitHeight}px`,
    height: digitHeight,
    fontFamily: variantFont.family,
    letterSpacing: variantFont.letterSpacing,
    fontVariantNumeric: 'tabular-nums',
  }
}
