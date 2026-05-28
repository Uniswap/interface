import { getSubscriptNotationParts } from 'utilities/src/format/getSubscriptNotationParts'
import { formatDotDecimalForLocale, normalizeIntlNumberToDotDecimal } from 'utilities/src/format/localeNumberSeparators'
import { roundForDisplay } from 'utilities/src/format/roundForDisplay'

export interface ParsedSubscriptNumber {
  useSubscript: boolean
  leadingZeros: number
  significantPart: string
  fullFormatted: string
}

export interface ParseForSubscriptNotationParams {
  value: number
  minSigDigits: number
  maxSigDigits: number
  subscriptThreshold: number
  locale?: string
}

/**
 * Strip trailing fraction zeros from a dot-decimal string (e.g. Intl padding after
 * normalization: "0.0010" → "0.001"). Skips scientific notation and compact suffixes (K/M/B/T).
 * Locale-formatted inputs should be normalized to dot-decimal first via `normalizeIntlNumberToDotDecimal`.
 */
export function trimFractionalTrailingZeros(formatted: string): string {
  if (/[eE]/.test(formatted)) {
    return formatted
  }
  if (/[kmbt]$/i.test(formatted)) {
    return formatted
  }
  const dotIndex = formatted.lastIndexOf('.')
  if (dotIndex === -1) {
    return formatted
  }
  const intPart = formatted.slice(0, dotIndex)
  const frac = formatted.slice(dotIndex + 1)
  if (!/^\d+$/.test(frac)) {
    return formatted
  }
  const trimmedFrac = frac.replace(/0+$/, '')
  return trimmedFrac.length > 0 ? `${intPart}.${trimmedFrac}` : intPart
}

/** Normalize Intl output to dot-decimal, trim padding zeros, then re-apply locale separators. */
function trimIntlFormattedTrailingZeros(intlFormatted: string, locale?: string): string {
  if (/[eE]/.test(intlFormatted) || /[kmbt]$/i.test(intlFormatted)) {
    return intlFormatted
  }
  const dotDecimal = normalizeIntlNumberToDotDecimal(intlFormatted, locale)
  const trimmed = trimFractionalTrailingZeros(dotDecimal)
  return formatDotDecimalForLocale(trimmed, locale)
}

/**
 * Parse a small decimal number for subscript notation display.
 *
 * For very small numbers like 0.00001024, instead of showing all zeros,
 * we can display it as "0.0₅1024" where the subscript 5 indicates 5 zeros.
 */
export function parseForSubscriptNotation(params: ParseForSubscriptNotationParams): ParsedSubscriptNumber {
  const { value, minSigDigits, maxSigDigits, subscriptThreshold, locale } = params
  if (value === 0) {
    return {
      useSubscript: false,
      leadingZeros: 0,
      significantPart: '0',
      fullFormatted: '0',
    }
  }

  const roundedValue = roundForDisplay(value, maxSigDigits)
  const absValue = Math.abs(roundedValue)

  if (absValue >= 1e15) {
    return {
      useSubscript: false,
      leadingZeros: 0,
      significantPart: '>999T',
      fullFormatted: '>999T',
    }
  }

  if (absValue >= 1) {
    const notation = absValue >= 1e6 ? 'compact' : 'standard'
    const formatted = new Intl.NumberFormat(locale, {
      minimumSignificantDigits: Math.min(minSigDigits, 3),
      maximumSignificantDigits: Math.min(maxSigDigits, 6),
      notation,
    }).format(roundedValue)
    const display = notation === 'compact' ? formatted : trimIntlFormattedTrailingZeros(formatted, locale)
    return {
      useSubscript: false,
      leadingZeros: 0,
      significantPart: display,
      fullFormatted: display,
    }
  }

  const subscriptParts = getSubscriptNotationParts({
    value: absValue,
    subscriptThreshold,
    maxSigDigits,
    minSigDigits,
  })

  if (subscriptParts?.usesSubscript) {
    return {
      useSubscript: true,
      leadingZeros: subscriptParts.leadingZeros,
      significantPart: subscriptParts.significantPart,
      fullFormatted: `0.0${subscriptParts.leadingZeros}${subscriptParts.significantPart}`,
    }
  }

  const formatted = trimIntlFormattedTrailingZeros(
    new Intl.NumberFormat(locale, {
      minimumSignificantDigits: minSigDigits,
      maximumSignificantDigits: maxSigDigits,
    }).format(roundedValue),
    locale,
  )

  return {
    useSubscript: false,
    leadingZeros: 0,
    significantPart: formatted,
    fullFormatted: formatted,
  }
}
