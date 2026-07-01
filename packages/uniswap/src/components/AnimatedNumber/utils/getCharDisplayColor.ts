import { opacifyRaw } from 'ui/src/theme/color/utils'

/** Opacity (0–100) applied to decimal digits when fading a custom base color. */
export const CUSTOM_COLOR_FADED_DECIMAL_OPACITY = 60

export function getFadedDecimalColor({
  shouldFadeDecimals,
  baseColor,
  fadedDecimalColor,
  hasCustomColor,
}: {
  shouldFadeDecimals: boolean
  baseColor: string
  /** Default faded decimal color (matches ValueWithFadedDecimals `$neutral2`). */
  fadedDecimalColor: string
  hasCustomColor: boolean
}): string {
  if (!shouldFadeDecimals) {
    return fadedDecimalColor
  }
  if (hasCustomColor) {
    return opacifyRaw(CUSTOM_COLOR_FADED_DECIMAL_OPACITY, baseColor)
  }
  return fadedDecimalColor
}

export function getCharBaseColor({
  index,
  chars,
  decimalSeparator,
  shouldFadeDecimals,
  neutral1Color,
  fadedDecimalColor,
}: {
  index: number
  chars: string[]
  decimalSeparator: string
  shouldFadeDecimals: boolean
  neutral1Color: string
  fadedDecimalColor: string
}): string {
  const decimalSeparatorIndex = chars.indexOf(decimalSeparator) - 1
  const isDecimalPart = shouldFadeDecimals && index > decimalSeparatorIndex
  return isDecimalPart ? fadedDecimalColor : neutral1Color
}

export function getCharDisplayColor({
  index,
  chars,
  decimalSeparator,
  shouldFadeDecimals,
  commonPrefixLength,
  nextColor,
  neutral1Color,
  fadedDecimalColor,
}: {
  index: number
  chars: string[]
  decimalSeparator: string
  shouldFadeDecimals: boolean
  commonPrefixLength: number
  nextColor?: string
  neutral1Color: string
  fadedDecimalColor: string
}): string {
  const baseColor = getCharBaseColor({
    index,
    chars,
    decimalSeparator,
    shouldFadeDecimals,
    neutral1Color,
    fadedDecimalColor,
  })
  return nextColor && index >= commonPrefixLength ? nextColor : baseColor
}
