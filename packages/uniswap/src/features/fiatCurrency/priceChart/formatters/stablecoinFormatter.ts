import type {
  DecimalPlaceNumber,
  FiatDeltaFormatter,
  TrimTrailingZerosParams,
} from 'uniswap/src/features/fiatCurrency/priceChart/formatters/shared/types'
import {
  formatWithDecimals,
  formatZero,
  parseFormattedNumber,
  roundToDecimals,
} from 'uniswap/src/features/fiatCurrency/priceChart/formatters/shared/utils'

function getDecimalPlaces(absValue: number): DecimalPlaceNumber {
  if (absValue === 0) {
    return 'zero'
  }
  if (absValue >= 0.01) {
    return 2
  }
  if (absValue >= 0.001) {
    return 3
  }
  return 2 // Show $0.00 for < 0.001
}

function trimTrailingZeros(params: TrimTrailingZerosParams): string {
  const { formatted, decimals, roundedValue } = params

  // Special handling for stablecoins that round to zero
  // don't trim 3 decimal places
  if (roundedValue === 0 || decimals === 3) {
    return formatted
  }

  const { prefix, numberPart, suffix } = parseFormattedNumber(formatted)

  // Only trim 00 for 2 decimal places
  if (decimals === 2 && numberPart.match(/[.,]00$/)) {
    return prefix + numberPart.replace(/[.,]00$/, '') + suffix
  }

  return formatted
}

export function createStablecoinFormatter(): FiatDeltaFormatter {
  return {
    getDecimalPlaces,
    trimTrailingZeros,

    shouldShowBelowThreshold: () => false, // Never show threshold for stablecoins

    format: (params): string => {
      const { value, currency, formatNumberOrString } = params
      const absValue = Math.abs(value)
      let decimals = getDecimalPlaces(absValue)

      if (decimals === 'zero') {
        return formatZero(currency, formatNumberOrString)
      }

      // Stablecoins treat values < 0.001 as zero (return $0.00)
      if (absValue < 0.001 && absValue > 0) {
        return formatZero(currency, formatNumberOrString)
      }

      // Check if rounding changes which decimal bucket we're in
      // For example, 0.0099 rounds to 0.01 with 3 decimals, which should use 2 decimals
      if (decimals === 3) {
        const rounded = roundToDecimals(absValue, 3)
        if (rounded >= 0.01) {
          decimals = 2
        }
      }

      return formatWithDecimals({
        value,
        decimals: decimals as number,
        currency,
        formatNumberOrString,
        trimZeros: trimTrailingZeros,
      })
    },
  }
}
