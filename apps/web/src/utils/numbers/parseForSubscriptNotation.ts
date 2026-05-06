import { getSubscriptNotationParts } from '~/utils/numbers/getSubscriptNotationParts'
import { roundForDisplay } from '~/utils/numbers/roundForDisplay'

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
}

/**
 * Parse a small decimal number for subscript notation display.
 *
 * For very small numbers like 0.00001024, instead of showing all zeros,
 * we can display it as "0.0₅1024" where the subscript 5 indicates 5 zeros.
 */
export function parseForSubscriptNotation(params: ParseForSubscriptNotationParams): ParsedSubscriptNumber {
  const { value, minSigDigits, maxSigDigits, subscriptThreshold } = params
  if (value === 0) {
    return {
      useSubscript: false,
      leadingZeros: 0,
      significantPart: '0',
      fullFormatted: '0',
    }
  }

  const roundedValue = roundForDisplay(value)
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
    const formatted = new Intl.NumberFormat(undefined, {
      minimumSignificantDigits: Math.min(minSigDigits, 3),
      maximumSignificantDigits: Math.min(maxSigDigits, 6),
      notation: absValue >= 1e6 ? 'compact' : 'standard',
    }).format(roundedValue)
    return {
      useSubscript: false,
      leadingZeros: 0,
      significantPart: formatted,
      fullFormatted: formatted,
    }
  }

  const subscriptParts = getSubscriptNotationParts({
    value: absValue,
    subscriptThreshold,
    maxSigDigits,
  })

  if (subscriptParts?.usesSubscript) {
    return {
      useSubscript: true,
      leadingZeros: subscriptParts.leadingZeros,
      significantPart: subscriptParts.significantPart,
      fullFormatted: `0.0${subscriptParts.leadingZeros}${subscriptParts.significantPart}`,
    }
  }

  const formatted = new Intl.NumberFormat(undefined, {
    minimumSignificantDigits: minSigDigits,
    maximumSignificantDigits: maxSigDigits,
  }).format(roundedValue)

  return {
    useSubscript: false,
    leadingZeros: 0,
    significantPart: formatted,
    fullFormatted: formatted,
  }
}
