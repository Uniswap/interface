import { toSubscript } from '~/components/Charts/utils/subscript'
import { getSubscriptNotationParts } from '~/components/Charts/utils/subscriptFormat'

/** Threshold for using subscript notation (number of leading zeros after decimal) */
const SUBSCRIPT_THRESHOLD = 4

interface FormatPriceValueParams {
  price: number
  scaleFactor: number
  maxFractionDigits: number
  locale?: string
}

/**
 * Format a price value for display on Y-axis using subscript notation for small values.
 *
 * For very small numbers like 0.00001024, instead of showing all zeros,
 * we display it as "0.0₅1024" where the subscript 5 indicates 5 zeros.
 * This matches the tooltip format for consistency.
 */
function formatPriceValue({ price, scaleFactor, locale }: FormatPriceValueParams): string {
  const originalPrice = price / scaleFactor

  if (originalPrice === 0) {
    return '0'
  }

  const absValue = Math.abs(originalPrice)

  // For numbers >= 1, use standard formatting
  if (absValue >= 1) {
    return new Intl.NumberFormat(locale, {
      minimumSignificantDigits: 2,
      maximumSignificantDigits: 4,
    }).format(originalPrice)
  }

  const subscriptParts = getSubscriptNotationParts({
    value: absValue,
    subscriptThreshold: SUBSCRIPT_THRESHOLD,
    maxSigDigits: 4,
    minSigDigits: 2,
  })

  if (subscriptParts?.usesSubscript) {
    return `0.0${toSubscript(subscriptParts.leadingZeros)}${subscriptParts.significantPart}`
  }

  // Use standard formatting with appropriate precision
  return new Intl.NumberFormat(locale, {
    minimumSignificantDigits: 2,
    maximumSignificantDigits: 4,
  }).format(originalPrice)
}

interface CreateYAxisPriceFormatterParams {
  scaleFactor: number
  maxFractionDigits: number
  locale?: string
}

/**
 * Create a price formatter function for lightweight-charts Y-axis.
 */
export function createYAxisPriceFormatter({
  scaleFactor,
  maxFractionDigits,
  locale,
}: CreateYAxisPriceFormatterParams): (price: number) => string {
  return (priceValue: number) => {
    const formatted = formatPriceValue({ price: priceValue, scaleFactor, maxFractionDigits, locale })
    return formatted
  }
}
