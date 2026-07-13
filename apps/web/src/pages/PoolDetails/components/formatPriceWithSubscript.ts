import type { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { formatNumberWithSubscript } from 'utilities/src/format/subscriptNotation'
import { NumberType } from 'utilities/src/format/types'

const DEFAULT_SUBSCRIPT_THRESHOLD = 0.001

type FormatNumberOrString = ReturnType<typeof useLocalizationContext>['formatNumberOrString']

/**
 * Format a numeric price/amount: falls back to the supplied `numberType` formatter when the
 * value is at or above `subscriptThreshold` (or exactly zero), and renders Unicode-subscript
 * notation (e.g. `0.0₈174`) below it. Use this anywhere a single token-denominated value can
 * dip below the standard formatter's display floor.
 */
export function formatPriceWithSubscript({
  price,
  locale,
  formatNumberOrString,
  numberType = NumberType.TokenNonTx,
  subscriptThreshold = DEFAULT_SUBSCRIPT_THRESHOLD,
  maxSigDigits,
  minSigDigits,
  fractionDigits,
}: {
  price: number
  locale: string
  formatNumberOrString: FormatNumberOrString
  numberType?: NumberType
  subscriptThreshold?: number
  /** Override the underlying helper's default of 4. Useful where extra precision aids comparison (e.g. tick tooltips). */
  maxSigDigits?: number
  /** Override the underlying helper's default of 2. */
  minSigDigits?: number
  /**
   * Force a fixed number of decimal places for values at/above the subscript threshold, bypassing the
   * magnitude-based `numberType` formatter. Used to keep low-variance (stablecoin) axes legible, where
   * the default formatter would collapse every gridline to the same "1.00" label.
   */
  fractionDigits?: number
}): string {
  if (price === 0 || Math.abs(price) >= subscriptThreshold) {
    if (fractionDigits !== undefined) {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(price)
    }
    return formatNumberOrString({ value: price, type: numberType })
  }
  return formatNumberWithSubscript({ value: price, locale, maxSigDigits, minSigDigits })
}
