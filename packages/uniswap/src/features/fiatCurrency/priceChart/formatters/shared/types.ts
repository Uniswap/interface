import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'

export type DecimalPlaceNumber = number | 'threshold' | 'zero'

export interface TrimTrailingZerosParams {
  formatted: string
  decimals: number
  roundedValue?: number // Optional - only used by stablecoin formatter
}

export interface FiatDeltaFormatter {
  getDecimalPlaces: (absValue: number) => DecimalPlaceNumber
  trimTrailingZeros: (params: TrimTrailingZerosParams) => string
  shouldShowBelowThreshold: (absValue: number) => boolean
  format: (params: FormatParams) => string
}

export interface FormatParams {
  value: number
  currency: FiatCurrency
  formatNumberOrString: (input: FormatNumberOrStringInput) => string
}

export interface FiatDeltaFormatOptions {
  startingPrice: number
  endingPrice: number
  isStablecoin?: boolean
  currency?: FiatCurrency
  formatNumberOrString: (input: FormatNumberOrStringInput) => string
}

export interface FormattedFiatDelta {
  formatted: string
  rawDelta: number
  belowThreshold?: boolean
}
