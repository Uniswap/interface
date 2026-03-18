import { toSubscript } from '~/components/Charts/utils/subscript'
import { getSubscriptNotationParts } from '~/components/Charts/utils/subscriptFormat'

/** Threshold for using subscript notation (4+ leading zeros) */
const SUBSCRIPT_THRESHOLD = 4

/**
 * Threshold for rounding up to a "nice" number.
 * If a value's significant digits are >= this fraction of the next power of 10, round up.
 * For example, 0.999 means 9.99... rounds up to 10 (next order of magnitude).
 */
const ROUND_UP_THRESHOLD = 0.999

/**
 * Rounds a number to a specified number of significant figures.
 *
 * This cleans up floating point noise like 0.0000101999... → 0.0000102
 *
 * @param value - The value to round
 * @param sigFigs - Number of significant figures to keep
 * @returns The rounded value
 */
function roundToSigFigs(value: number, sigFigs: number): number {
  if (value === 0 || !Number.isFinite(value)) {
    return value
  }

  const absValue = Math.abs(value)
  const magnitude = Math.floor(Math.log10(absValue))
  const scale = Math.pow(10, sigFigs - 1 - magnitude)
  const rounded = Math.round(absValue * scale) / scale

  return value < 0 ? -rounded : rounded
}

/**
 * Rounds a small decimal number to the nearest "nice" value for display purposes.
 *
 * This handles edge cases where Q96 fixed-point arithmetic produces values like
 * 0.00000999... that are semantically meant to be 0.00001.
 *
 * The function:
 * 1. Rounds UP when the value is extremely close (within 0.1%) to the next power of 10
 * 2. Cleans up floating point noise by rounding to significant figures
 *
 * Examples:
 * - 0.00000999 → 0.00001 (rounds up, as 9.99 is very close to 10)
 * - 0.0000101999... → 0.0000102 (cleaned up floating point noise)
 * - 0.0000095 → 0.0000095 (kept as-is, not close enough to 0.00001)
 *
 * @param value - The small decimal value to potentially round
 * @param sigFigs - Number of significant figures to preserve (default: 4)
 * @returns The rounded value
 */
export function roundForDisplay(value: number, sigFigs: number = 4): number {
  if (value === 0 || !Number.isFinite(value)) {
    return value
  }

  const absValue = Math.abs(value)

  // Only apply special rounding to small values (< 1)
  if (absValue >= 1) {
    return roundToSigFigs(value, sigFigs)
  }

  // Find the order of magnitude of the first significant digit
  const log10Value = Math.log10(absValue)
  const magnitude = Math.floor(log10Value)

  // Normalize to get the coefficient (should be in range [1, 10))
  const scaleFactor = Math.pow(10, magnitude)
  const coefficient = absValue / scaleFactor

  // If coefficient is very close to 10 (e.g., 9.99), round up to next power of 10
  if (coefficient >= 10 * ROUND_UP_THRESHOLD) {
    const roundedAbs = Math.pow(10, magnitude + 1)
    return value < 0 ? -roundedAbs : roundedAbs
  }

  // Clean up floating point noise by rounding to significant figures
  return roundToSigFigs(value, sigFigs)
}

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
