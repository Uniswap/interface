import { toSubscript } from '~/components/Charts/utils/subscript'
import { getSubscriptNotationParts } from '~/utils/numbers/getSubscriptNotationParts'
import { roundForDisplay } from '~/utils/numbers/roundForDisplay'

/** Threshold for using subscript notation (4+ leading zeros) */
const SUBSCRIPT_THRESHOLD = 4

interface FormatTokenPriceResult {
  /** Plain text version (uses Unicode subscript chars) */
  text: string
  /** HTML version with styled subscript span */
  html: string
  /** Whether subscript notation was used */
  usesSubscript: boolean
}

/**
 * Format token price for X-axis with subscript notation.
 * Example: 0.00000001024 → "0.0₈1024" (text) or "0.0<sub>8</sub>1024" (html)
 *
 * Returns both plain text and HTML versions. Use HTML for DOM elements
 * where you want to style the subscript (e.g., larger font size).
 */
export function formatTokenPriceSubscript(
  price: number,
  options?: { minSigDigits?: number; maxSigDigits?: number },
): FormatTokenPriceResult {
  const { minSigDigits = 3, maxSigDigits = 4 } = options ?? {}

  if (price === 0) {
    return { text: '0', html: '0', usesSubscript: false }
  }

  // Apply display rounding to clean up values like 0.00000999 → 0.00001
  const roundedPrice = roundForDisplay(price)
  const absValue = Math.abs(roundedPrice)

  // For numbers >= 1, use standard formatting
  if (absValue >= 1) {
    const formatted = new Intl.NumberFormat(undefined, {
      minimumSignificantDigits: Math.min(minSigDigits, 3),
      maximumSignificantDigits: maxSigDigits,
    }).format(roundedPrice)
    return { text: formatted, html: formatted, usesSubscript: false }
  }

  const subscriptParts = getSubscriptNotationParts({
    value: absValue,
    subscriptThreshold: SUBSCRIPT_THRESHOLD,
    maxSigDigits,
  })

  if (subscriptParts?.usesSubscript) {
    return {
      text: `0.0${toSubscript(subscriptParts.leadingZeros)}${subscriptParts.significantPart}`,
      html: `0.0<span style="font-size: 0.75em; vertical-align: baseline; position: relative; top: 0.1em;">${subscriptParts.leadingZeros}</span>${subscriptParts.significantPart}`,
      usesSubscript: true,
    }
  }

  const formatted = new Intl.NumberFormat(undefined, {
    minimumSignificantDigits: minSigDigits,
    maximumSignificantDigits: maxSigDigits,
  }).format(roundedPrice)
  return { text: formatted, html: formatted, usesSubscript: false }
}

/**
 * Format token volume for Y-axis (simple decimal, no symbol).
 * Handles very small values using subscript notation similar to formatTokenPriceSubscript.
 * Example: 1234.567 → "1,234.57"
 * Example: 0.00000001234 → "0.0₈1234"
 */
export function formatTokenVolume(amount: number, options?: { maxDecimals?: number }): string {
  const { maxDecimals = 3 } = options ?? {}

  if (amount === 0) {
    return '0'
  }

  const absValue = Math.abs(amount)

  // For values >= 0.001, use standard formatting
  if (absValue >= 0.001) {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
    }).format(amount)
  }

  const subscriptParts = getSubscriptNotationParts({
    value: absValue,
    subscriptThreshold: SUBSCRIPT_THRESHOLD,
    maxSigDigits: 4,
  })

  if (subscriptParts?.usesSubscript) {
    const sign = amount < 0 ? '-' : ''
    return `${sign}0.0${toSubscript(subscriptParts.leadingZeros)}${subscriptParts.significantPart}`
  }

  // For small but not tiny values, use scientific notation or more decimals
  return new Intl.NumberFormat(undefined, {
    minimumSignificantDigits: 2,
    maximumSignificantDigits: 4,
  }).format(amount)
}
