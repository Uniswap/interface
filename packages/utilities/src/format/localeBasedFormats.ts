// Number formatting in our app should follow the guide in this doc:
// https://www.notion.so/uniswaplabs/Number-standards-fbb9f533f10e4e22820722c2f66d23c0

import { NumberType } from 'utilities/src/format/types'

const numberFormatCache: Record<string, Intl.NumberFormat> = {}

function getNumberFormat({
  name,
  locale,
  props,
}: {
  name: string
  locale: Parameters<typeof Intl.NumberFormat>[0]
  props: Parameters<typeof Intl.NumberFormat>[1]
}): Intl.NumberFormat {
  const key = `${locale}--${props?.currency ?? 'NONE'}--${name}}`

  let format = numberFormatCache[key]

  if (format) {
    return format
  }

  format = new Intl.NumberFormat(locale, props)
  numberFormatCache[key] = format
  return format
}

export const StandardCurrency: FormatCreator = {
  createFormat(locale, currencyCode) {
    return getNumberFormat({
      name: 'StandardCurrency',
      locale,
      props: {
        notation: 'standard',
        style: 'currency',
        currency: currencyCode,
      },
    })
  },
}

export const SmallestNumCurrency: FormatCreator = {
  createFormat(locale, currencyCode) {
    return getNumberFormat({
      name: 'SmallestNumCurrency',
      locale,
      props: {
        notation: 'standard',
        maximumFractionDigits: 20, // max allowed digits
        currency: currencyCode,
        style: 'currency',
      },
    })
  },
}

export const FiveDecimalsMaxTwoDecimalsMin: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'FiveDecimalsMaxTwoDecimalsMin',
      locale,
      props: {
        notation: 'standard',
        maximumFractionDigits: 5,
        minimumFractionDigits: 2,
      },
    })
  },
}

export const FiveDecimalsMaxTwoDecimalsMinNoCommas: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'FiveDecimalsMaxTwoDecimalsMinNoCommas',
      locale,
      props: {
        notation: 'standard',
        maximumFractionDigits: 5,
        minimumFractionDigits: 2,
        useGrouping: false,
      },
    })
  },
}

export const NoDecimals: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'NoDecimals',
      locale,
      props: {
        notation: 'standard',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      },
    })
  },
}

export const ThreeDecimals: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'ThreeDecimals',
      locale,
      props: {
        notation: 'standard',
        maximumFractionDigits: 3,
        minimumFractionDigits: 3,
      },
    })
  },
}

export const ThreeDecimalsCurrency: FormatCreator = {
  createFormat: (locale: string, currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'ThreeDecimalsCurrency',
      locale,
      props: {
        notation: 'standard',
        maximumFractionDigits: 3,
        minimumFractionDigits: 3,
        currency: currencyCode,
        style: 'currency',
      },
    })
  },
}

export const TwoDecimalsCurrency: FormatCreator = {
  createFormat: (locale: string, currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'TwoDecimalsCurrency',
      locale,
      props: {
        notation: 'standard',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        currency: currencyCode,
        style: 'currency',
      },
    })
  },
}

export const ShorthandTwoDecimalsCurrency: FormatCreator = {
  createFormat: (locale: string, currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'ShorthandTwoDecimalsCurrency',
      locale,
      props: {
        notation: 'compact',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        currency: currencyCode,
        style: 'currency',
      },
    })
  },
}

export const ShorthandOneDecimalsCurrency: FormatCreator = {
  createFormat: (locale: string, currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'ShorthandOneDecimalsCurrency',
      locale,
      props: {
        notation: 'compact',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
        currency: currencyCode,
        style: 'currency',
      },
    })
  },
}

export const ThreeSigFigsCurrency: FormatCreator = {
  createFormat: (locale: string, currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'ThreeSigFigsCurrency',
      locale,
      props: {
        notation: 'standard',
        minimumSignificantDigits: 3,
        maximumSignificantDigits: 3,
        currency: currencyCode,
        style: 'currency',
      },
    })
  },
}

export const TwoDecimals: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'TwoDecimals',
      locale,
      props: {
        notation: 'standard',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      },
    })
  },
}

export const ShorthandOneDecimal: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'ShorthandOneDecimal',
      locale,
      props: {
        notation: 'compact',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      },
    })
  },
}

export const ShorthandTwoDecimals: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'ShorthandTwoDecimals',
      locale,
      props: {
        notation: 'compact',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    })
  },
}

export const SixSigFigsTwoDecimals: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'SixSigFigsTwoDecimals',
      locale,
      props: {
        notation: 'standard',
        maximumSignificantDigits: 6,
        minimumSignificantDigits: 3,
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      },
    })
  },
}

export const SixSigFigsNoCommas: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'SixSigFigsNoCommas',
      locale,
      props: {
        notation: 'standard',
        maximumSignificantDigits: 6,
        useGrouping: false,
      },
    })
  },
}

export const SixSigFigsTwoDecimalsNoCommas: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'SixSigFigsTwoDecimalsNoCommas',
      locale,
      props: {
        notation: 'standard',
        maximumSignificantDigits: 6,
        minimumSignificantDigits: 3,
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        useGrouping: false,
      },
    })
  },
}

export const NoTrailingDecimalsPercentages: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'NoTrailingDecimalsPercentages',
      locale,
      props: {
        notation: 'standard',
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    })
  },
}

export const TwoDecimalsPercentages: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'TwoDecimalsPercentages',
      locale,
      props: {
        notation: 'standard',
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    })
  },
}

export interface FormatCreator {
  /**
   * Creates a Intl.NumberFormat based off of locale and currency
   * @param locale comprised of a two letter ISO 639 language code combined with ISO 3166 country code e.g. "en-US"
   * @param currencyCode three letter ISO 4217 currency code e.g. "USD"
   * @returns created Intl.NumberFormat
   */
  createFormat: (locale: string, currencyCode: string) => Intl.NumberFormat
}
export type Format = string | FormatCreator

// each rule must contain either an `upperBound` or an `exact` value.
// upperBound => number will use that formatter as long as it is < upperBound
// exact => number will use that formatter if it is === exact
export type FormatterRule =
  | {
      upperBound?: undefined
      exact: number
      formatter: Format
      overrideValue?: number
      postFormatModifier?: (formatted: string) => string
    }
  | {
      upperBound: number
      exact?: undefined
      formatter: Format
      overrideValue?: number
      postFormatModifier?: (formatted: string) => string
    }

// these formatter objects dictate which formatter rule to use based on the interval that
// the number falls into. for example, based on the rule set below, if your number
// falls between 1 and 1e6, you'd use TwoDecimals as the formatter.
export const tokenNonTxFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.001, formatter: '<0.001' },
  { upperBound: 1, formatter: ThreeDecimals },
  { upperBound: 1e6, formatter: TwoDecimals },
  { upperBound: 1e15, formatter: ShorthandTwoDecimals },
  { upperBound: Infinity, formatter: '>999T' },
]

export const tokenTxFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.00001, formatter: '<0.00001' },
  { upperBound: 1, formatter: FiveDecimalsMaxTwoDecimalsMin },
  { upperBound: 10000, formatter: SixSigFigsTwoDecimals },
  { upperBound: Infinity, formatter: TwoDecimals },
]

export const swapTradeAmountFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.1, formatter: SixSigFigsNoCommas },
  { upperBound: 1, formatter: FiveDecimalsMaxTwoDecimalsMinNoCommas },
  { upperBound: Infinity, formatter: SixSigFigsTwoDecimalsNoCommas },
]

export const swapPriceFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.00001, formatter: '<0.00001' },
  ...swapTradeAmountFormatter,
]

export const fiatTokenDetailsFormatter: FormatterRule[] = [
  {
    upperBound: 0.00000001,
    overrideValue: 0.00000001,
    formatter: SmallestNumCurrency,
    postFormatModifier: (formatted: string) => `<${formatted}`,
  },
  { upperBound: 0.1, formatter: ThreeSigFigsCurrency },
  { upperBound: 1.05, formatter: ThreeDecimalsCurrency },
  { upperBound: 1e6, formatter: TwoDecimalsCurrency },
  { upperBound: Infinity, formatter: ShorthandTwoDecimalsCurrency },
]

export const fiatTokenPricesFormatter: FormatterRule[] = [
  {
    upperBound: 0.00000001,
    overrideValue: 0.00000001,
    formatter: SmallestNumCurrency,
    postFormatModifier: (formatted: string) => `<${formatted}`,
  },
  { upperBound: 1, formatter: ThreeSigFigsCurrency },
  { upperBound: 1e6, formatter: TwoDecimalsCurrency },
  { upperBound: Infinity, formatter: ShorthandTwoDecimalsCurrency },
]

export const fiatTokenStatsFormatter: FormatterRule[] = [
  // if token stat value is 0, we probably don't have the data for it, so show '-' as a placeholder
  { exact: 0, formatter: '-' },
  {
    upperBound: 0.01,
    overrideValue: 0.01,
    formatter: SmallestNumCurrency,
    postFormatModifier: (formatted: string) => `<${formatted}`,
  },
  { upperBound: 1000, formatter: TwoDecimalsCurrency },
  { upperBound: Infinity, formatter: ShorthandOneDecimalsCurrency },
]

export const fiatGasPriceFormatter: FormatterRule[] = [
  { exact: 0, formatter: StandardCurrency },
  {
    upperBound: 0.01,
    overrideValue: 0.01,
    formatter: SmallestNumCurrency,
    postFormatModifier: (formatted: string) => `<${formatted}`,
  },
  { upperBound: 1e6, formatter: TwoDecimalsCurrency },
  { upperBound: Infinity, formatter: ShorthandTwoDecimalsCurrency },
]

export const fiatStandardFormatter: FormatterRule[] = [
  {
    upperBound: Infinity,
    formatter: StandardCurrency,
  },
]

export const fiatTokenQuantityFormatter = [
  {
    exact: 0,
    formatter: StandardCurrency,
  },
  ...fiatGasPriceFormatter,
]

export const portfolioBalanceFormatter: FormatterRule[] = [
  { exact: 0, formatter: StandardCurrency },
  { upperBound: Infinity, formatter: TwoDecimalsCurrency },
]

export const ntfTokenFloorPriceFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.001, formatter: '<0.001' },
  { upperBound: 1, formatter: ThreeDecimals },
  { upperBound: 1000, formatter: TwoDecimals },
  { upperBound: 1e15, formatter: ShorthandTwoDecimals },
  { upperBound: Infinity, formatter: '>999T' },
]

export const ntfCollectionStatsFormatter: FormatterRule[] = [
  { upperBound: 1000, formatter: NoDecimals },
  { upperBound: Infinity, formatter: ShorthandOneDecimal },
]

export const percentagesFormatter: FormatterRule[] = [
  { upperBound: 0.01, formatter: TwoDecimalsPercentages },
  { upperBound: Infinity, formatter: NoTrailingDecimalsPercentages },
]

export const TYPE_TO_FORMATTER_RULES = {
  [NumberType.TokenNonTx]: tokenNonTxFormatter,
  [NumberType.TokenTx]: tokenTxFormatter,
  [NumberType.SwapPrice]: swapPriceFormatter,
  [NumberType.SwapTradeAmount]: swapTradeAmountFormatter,
  [NumberType.FiatStandard]: fiatStandardFormatter,
  [NumberType.FiatTokenQuantity]: fiatTokenQuantityFormatter,
  [NumberType.FiatTokenDetails]: fiatTokenDetailsFormatter,
  [NumberType.FiatTokenPrice]: fiatTokenPricesFormatter,
  [NumberType.FiatTokenStats]: fiatTokenStatsFormatter,
  [NumberType.FiatGasPrice]: fiatGasPriceFormatter,
  [NumberType.PortfolioBalance]: portfolioBalanceFormatter,
  [NumberType.NFTTokenFloorPrice]: ntfTokenFloorPriceFormatter,
  [NumberType.NFTCollectionStats]: ntfCollectionStatsFormatter,
  [NumberType.Percentage]: percentagesFormatter,
}
