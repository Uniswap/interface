import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { getFiatCurrencyCode } from 'uniswap/src/features/fiatCurrency/hooks'
import { TrimTrailingZerosParams } from 'uniswap/src/features/fiatCurrency/priceChart/formatters/shared/types'
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'
import { NumberType } from 'utilities/src/format/types'

export const FIAT_DELTA_THRESHOLD = 0.000001
const FORMATTED_NUMBER_PATTERN = /^([^0-9]*)([0-9,.\s]+)(.*)$/

export function roundToDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

export function formatZero(
  currency: FiatCurrency,
  formatNumberOrString: (input: FormatNumberOrStringInput) => string,
): string {
  const currencyCode = getFiatCurrencyCode(currency)
  return formatNumberOrString({
    value: 0,
    type: NumberType.FiatStandard,
    currencyCode,
  })
}

export function formatThreshold(
  currency: FiatCurrency,
  formatNumberOrString: (input: FormatNumberOrStringInput) => string,
): string {
  const currencyCode = getFiatCurrencyCode(currency)

  // Format just the threshold value to get proper currency symbol
  const formatted = formatNumberOrString({
    value: FIAT_DELTA_THRESHOLD,
    type: NumberType.FiatTokenDetails,
    currencyCode,
  })

  return `<${formatted}`
}

export function formatWithDecimals(params: {
  value: number
  decimals: number
  currency: FiatCurrency
  formatNumberOrString: (input: FormatNumberOrStringInput) => string
  trimZeros: (params: TrimTrailingZerosParams) => string
}): string {
  const { value, decimals, currency, formatNumberOrString, trimZeros } = params
  const absValue = Math.abs(value)
  const currencyCode = getFiatCurrencyCode(currency)

  // Round the value to the specified decimals
  const roundedValue = roundToDecimals(absValue, decimals)

  // For very small values, we need to use a different number type that preserves precision
  // NumberType.FiatStandard uses StandardCurrency which defaults to 2 decimals
  // NumberType.FiatTokenDetails uses rules that preserve precision for small values
  let formatted: string

  if (decimals > 2 && roundedValue < 1) {
    // Use FiatTokenDetails which has SmallestNumCurrency for small values
    // This preserves up to 20 decimals and respects the user's locale
    formatted = formatNumberOrString({
      value: roundedValue,
      type: NumberType.FiatTokenDetails,
      currencyCode,
    })
  } else {
    // For larger values or values with 2 decimals, use the standard formatter
    formatted = formatNumberOrString({
      value: roundedValue,
      type: NumberType.FiatStandard,
      currencyCode,
    })
  }

  return trimZeros({ formatted, decimals, roundedValue })
}

export function parseFormattedNumber(formatted: string): {
  prefix: string
  numberPart: string
  suffix: string
} {
  const match = formatted.match(FORMATTED_NUMBER_PATTERN)
  if (!match) {
    return { prefix: '', numberPart: formatted, suffix: '' }
  }
  const [, prefix = '', numberPart = '', suffix = ''] = match
  return { prefix, numberPart, suffix }
}
