import type {
  DecimalPlaceNumber,
  FiatDeltaFormatter,
  TrimTrailingZerosParams,
} from 'uniswap/src/features/fiatCurrency/priceChart/formatters/shared/types'
import {
  FIAT_DELTA_THRESHOLD,
  formatThreshold,
  formatWithDecimals,
  formatZero,
  parseFormattedNumber,
} from 'uniswap/src/features/fiatCurrency/priceChart/formatters/shared/utils'

const DECIMAL_THRESHOLDS = [
  { min: 1, decimals: 2 },
  { min: 0.1, decimals: 2 },
  { min: 0.01, decimals: 3 },
  { min: 0.001, decimals: 4 },
  { min: 0.0001, decimals: 5 },
  { min: 0.00001, decimals: 6 },
] as const

function getDecimalPlaces(absValue: number): DecimalPlaceNumber {
  if (absValue === 0) {
    return 'zero'
  }

  // Use a small epsilon for floating point comparison
  const EPSILON = 1e-10

  for (const { min, decimals } of DECIMAL_THRESHOLDS) {
    // Use epsilon comparison to handle floating point errors
    if (absValue >= min - EPSILON) {
      return decimals
    }
  }

  return 'threshold'
}

function trimTrailingZeros(params: TrimTrailingZerosParams): string {
  const { formatted, decimals } = params
  const { prefix, numberPart, suffix } = parseFormattedNumber(formatted)
  let trimmed = numberPart

  if (decimals === 2) {
    // For 2 decimal places, keep both decimals (don't trim trailing zeros)
    // This ensures values like $0.10 stay as $0.10, not $0.1
    trimmed = numberPart
  } else if (decimals > 2) {
    // For decimals > 2, trim all trailing zeros (including the decimal point if no significant digits remain)
    trimmed = numberPart.replace(/(\.\d*?)0+$/, '$1')
    // If we end with just a decimal point, remove it
    trimmed = trimmed.replace(/\.$/, '')
  }

  return prefix + trimmed + suffix
}

export function createStandardFormatter(): FiatDeltaFormatter {
  return {
    getDecimalPlaces,
    trimTrailingZeros,

    shouldShowBelowThreshold: (absValue: number) => absValue > 0 && absValue < FIAT_DELTA_THRESHOLD,

    format: (params): string => {
      const { value, currency, formatNumberOrString } = params
      const absValue = Math.abs(value)
      const decimals = getDecimalPlaces(absValue)

      switch (decimals) {
        case 'zero':
          return formatZero(currency, formatNumberOrString)
        case 'threshold':
          return formatThreshold(currency, formatNumberOrString)
        default:
          return formatWithDecimals({
            value,
            decimals,
            currency,
            formatNumberOrString,
            trimZeros: trimTrailingZeros,
          })
      }
    },
  }
}
