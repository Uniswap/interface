/** Font sizes an amount shrinks between, in px. */
export interface AmountFontSizeRange {
  max: number
  min: number
}

/** @internal The swap panel's range; the compact panel passes 18 to 12. */
export const DEFAULT_AMOUNT_FONT_SIZE_RANGE: AmountFontSizeRange = { max: 36, min: 24 }

/** @internal */
export const AMOUNT_LINE_HEIGHT_RATIO = 1.2

// Width of a wide glyph at 36px in the heading font. Retune if the font changes.
const MAX_CHAR_PIXEL_WIDTH_AT_36 = 23

/**
 * Approximate width of each glyph relative to a wide Latin glyph. Unlisted characters
 * count as 1. Digits and `.` sit slightly high so long decimals never underestimate and
 * overflow the field. Same table as ui/src getRelativeCharWidth.
 */
const RELATIVE_CHAR_WIDTH: Record<string, number> = {
  ' ': 0.5,
  '.': 0.52,
  ',': 0.48,
  ':': 0.42,
  ';': 0.42,
  '`': 0.4,
  "'": 0.32,
  '‘': 0.32,
  '’': 0.32,
  '!': 0.48,
  '|': 0.42,
  '-': 0.58,
  '+': 0.78,
  '=': 0.78,
  '1': 0.62,
  '7': 0.9,
  i: 0.45,
  I: 0.55,
  l: 0.45,
  L: 0.55,
  j: 0.48,
  J: 0.55,
  t: 0.55,
  T: 0.65,
  f: 0.55,
  F: 0.72,
  r: 0.58,
  R: 0.78,
  m: 1.28,
  M: 1.22,
  w: 1.28,
  W: 1.25,
  '@': 1.22,
  '%': 1.18,
  '&': 1.12,
  Q: 1.08,
  q: 0.95,
}

/**
 * @internal The font size that fits `text` in `availableWidth`, clamped to `range`. The
 * largest size until the field has been measured. Same result as the old
 * useDynamicFontSizing, computed from the text instead of stepped from the last size.
 */
export function getAmountFontSize({
  text,
  availableWidth,
  range,
}: {
  text: string
  availableWidth: number
  range: AmountFontSizeRange
}): number {
  const maxCharWidth = (range.max / DEFAULT_AMOUNT_FONT_SIZE_RANGE.max) * MAX_CHAR_PIXEL_WIDTH_AT_36
  const widthAtMax = Array.from(text).reduce((sum, char) => sum + (RELATIVE_CHAR_WIDTH[char] ?? 1) * maxCharWidth, 0)

  if (!availableWidth || !widthAtMax) {
    return range.max
  }

  const fitted = (availableWidth * range.max) / widthAtMax
  return Math.round(Math.min(range.max, Math.max(fitted, range.min)))
}
