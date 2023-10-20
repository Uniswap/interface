import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { NumberType } from 'utilities/src/format/types'

// Number formatting in our app should follow the guide in this doc:
// https://www.notion.so/uniswaplabs/Number-standards-fbb9f533f10e4e22820722c2f66d23c0

const FiveDecimalsMaxTwoDecimalsMin: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return new Intl.NumberFormat(locale, {
      notation: 'standard',
      maximumFractionDigits: 5,
      minimumFractionDigits: 2,
    })
  },
}

const FiveDecimalsMaxTwoDecimalsMinNoCommas: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return new Intl.NumberFormat(locale, {
      notation: 'standard',
      maximumFractionDigits: 5,
      minimumFractionDigits: 2,
      useGrouping: false,
    })
  },
}

const NoDecimals: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return new Intl.NumberFormat(locale, {
      notation: 'standard',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    })
  },
}

const ThreeDecimals: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return new Intl.NumberFormat(locale, {
      notation: 'standard',
      maximumFractionDigits: 3,
      minimumFractionDigits: 3,
    })
  },
}

const ThreeDecimalsCurrency: FormatCreator = {
  createFormat: (locale: string, currencyCode: string): Intl.NumberFormat => {
    return new Intl.NumberFormat(locale, {
      notation: 'standard',
      maximumFractionDigits: 3,
      minimumFractionDigits: 3,
      currency: currencyCode,
      style: 'currency',
    })
  },
}

const TwoDecimalsCurrency: FormatCreator = {
  createFormat: (locale: string, currencyCode: string): Intl.NumberFormat => {
    return new Intl.NumberFormat(locale, {
      notation: 'standard',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      currency: currencyCode,
      style: 'currency',
    })
  },
}

const ShorthandTwoDecimalsCurrency: FormatCreator = {
  createFormat: (locale: string, currencyCode: string): Intl.NumberFormat => {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currency: currencyCode,
      style: 'currency',
    })
  },
}

const ShorthandOneDecimalsCurrency: FormatCreator = {
  createFormat: (locale: string, currencyCode: string): Intl.NumberFormat => {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      currency: currencyCode,
      style: 'currency',
    })
  },
}

const ThreeSigFigsCurrency: FormatCreator = {
  createFormat: (locale: string, currencyCode: string): Intl.NumberFormat => {
    return new Intl.NumberFormat(locale, {
      notation: 'standard',
      minimumSignificantDigits: 3,
      maximumSignificantDigits: 3,
      currency: currencyCode,
      style: 'currency',
    })
  },
}

const TwoDecimals: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return new Intl.NumberFormat(locale, {
      notation: 'standard',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })
  },
}

const ShorthandOneDecimal: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })
  },
}

const ShorthandTwoDecimals: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  },
}

const SixSigFigsTwoDecimals: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return new Intl.NumberFormat(locale, {
      notation: 'standard',
      maximumSignificantDigits: 6,
      minimumSignificantDigits: 3,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })
  },
}

const SixSigFigsNoCommas: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return new Intl.NumberFormat(locale, {
      notation: 'standard',
      maximumSignificantDigits: 6,
      useGrouping: false,
    })
  },
}

const SixSigFigsTwoDecimalsNoCommas: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return new Intl.NumberFormat(locale, {
      notation: 'standard',
      maximumSignificantDigits: 6,
      minimumSignificantDigits: 3,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      useGrouping: false,
    })
  },
}

const NoTrailingDecimalsPercentages: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return new Intl.NumberFormat(locale, {
      notation: 'standard',
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  },
}

const TwoDecimalsPercentages: FormatCreator = {
  createFormat: (locale: string, _currencyCode: string): Intl.NumberFormat => {
    return new Intl.NumberFormat(locale, {
      notation: 'standard',
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  },
}

interface FormatCreator {
  /**
   * Creates a Intl.NumberFormat based off of locale and currency
   * @param locale comprised of a two letter ISO 639 language code combined with ISO 3166 country code e.g. "en-US"
   * @param currencyCode three letter ISO 4217 currency code e.g. "USD"
   * @returns created Intl.NumberFormat
   */
  createFormat: (locale: string, currencyCode: string) => Intl.NumberFormat
}
type Format = string | FormatCreator

// each rule must contain either an `upperBound` or an `exact` value.
// upperBound => number will use that formatter as long as it is < upperBound
// exact => number will use that formatter if it is === exact
type FormatterRule =
  | { upperBound?: undefined; exact: number; formatter: Format }
  | { upperBound: number; exact?: undefined; formatter: Format }

// these formatter objects dictate which formatter rule to use based on the interval that
// the number falls into. for example, based on the rule set below, if your number
// falls between 1 and 1e6, you'd use TwoDecimals as the formatter.
const tokenNonTxFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.001, formatter: '<0.001' },
  { upperBound: 1, formatter: ThreeDecimals },
  { upperBound: 1e6, formatter: TwoDecimals },
  { upperBound: 1e15, formatter: ShorthandTwoDecimals },
  { upperBound: Infinity, formatter: '>999T' },
]

const tokenTxFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.00001, formatter: '<0.00001' },
  { upperBound: 1, formatter: FiveDecimalsMaxTwoDecimalsMin },
  { upperBound: 10000, formatter: SixSigFigsTwoDecimals },
  { upperBound: Infinity, formatter: TwoDecimals },
]

const swapTradeAmountFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.1, formatter: SixSigFigsNoCommas },
  { upperBound: 1, formatter: FiveDecimalsMaxTwoDecimalsMinNoCommas },
  { upperBound: Infinity, formatter: SixSigFigsTwoDecimalsNoCommas },
]

const swapPriceFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.00001, formatter: '<0.00001' },
  ...swapTradeAmountFormatter,
]

const fiatTokenDetailsFormatter: FormatterRule[] = [
  { upperBound: 0.00000001, formatter: '<$0.00000001' },
  { upperBound: 0.1, formatter: ThreeSigFigsCurrency },
  { upperBound: 1.05, formatter: ThreeDecimalsCurrency },
  { upperBound: 1e6, formatter: TwoDecimalsCurrency },
  { upperBound: Infinity, formatter: ShorthandTwoDecimalsCurrency },
]

const fiatTokenPricesFormatter: FormatterRule[] = [
  { upperBound: 0.00000001, formatter: '<$0.00000001' },
  { upperBound: 1, formatter: ThreeSigFigsCurrency },
  { upperBound: 1e6, formatter: TwoDecimalsCurrency },
  { upperBound: Infinity, formatter: ShorthandTwoDecimalsCurrency },
]

const fiatTokenStatsFormatter: FormatterRule[] = [
  // if token stat value is 0, we probably don't have the data for it, so show '-' as a placeholder
  { exact: 0, formatter: '-' },
  { upperBound: 0.01, formatter: '<$0.01' },
  { upperBound: 1000, formatter: TwoDecimalsCurrency },
  { upperBound: Infinity, formatter: ShorthandOneDecimalsCurrency },
]

const fiatGasPriceFormatter: FormatterRule[] = [
  { exact: 0, formatter: '$0' },
  { upperBound: 0.01, formatter: '<$0.01' },
  { upperBound: 1e6, formatter: TwoDecimalsCurrency },
  { upperBound: Infinity, formatter: ShorthandTwoDecimalsCurrency },
]

const fiatTokenQuantityFormatter = [{ exact: 0, formatter: '$0.00' }, ...fiatGasPriceFormatter]

const portfolioBalanceFormatter: FormatterRule[] = [
  { exact: 0, formatter: '$0.00' },
  { upperBound: Infinity, formatter: TwoDecimalsCurrency },
]

const ntfTokenFloorPriceFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.001, formatter: '<0.001' },
  { upperBound: 1, formatter: ThreeDecimals },
  { upperBound: 1000, formatter: TwoDecimals },
  { upperBound: 1e15, formatter: ShorthandTwoDecimals },
  { upperBound: Infinity, formatter: '>999T' },
]

const ntfCollectionStatsFormatter: FormatterRule[] = [
  { upperBound: 1000, formatter: NoDecimals },
  { upperBound: Infinity, formatter: ShorthandOneDecimal },
]

const percentagesFormatter: FormatterRule[] = [
  { upperBound: 0.01, formatter: TwoDecimalsPercentages },
  { upperBound: Infinity, formatter: NoTrailingDecimalsPercentages },
]

const TYPE_TO_FORMATTER_RULES = {
  [NumberType.TokenNonTx]: tokenNonTxFormatter,
  [NumberType.TokenTx]: tokenTxFormatter,
  [NumberType.SwapPrice]: swapPriceFormatter,
  [NumberType.SwapTradeAmount]: swapTradeAmountFormatter,
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

function getFormatterRule(input: number, type: NumberType): Format {
  const rules = TYPE_TO_FORMATTER_RULES[type]
  for (const rule of rules) {
    if (
      (rule.exact !== undefined && input === rule.exact) ||
      (rule.upperBound !== undefined && input < rule.upperBound)
    ) {
      return rule.formatter
    }
  }

  throw new Error(`formatter for type ${type} not configured correctly`)
}

export function formatNumber({
  input,
  locale,
  currencyCode = 'USD',
  type = NumberType.TokenNonTx,
  placeholder = '-',
}: {
  input: number | null | undefined
  locale: string
  currencyCode?: string
  type?: NumberType
  placeholder?: string
}): string {
  if (input === null || input === undefined) {
    return placeholder
  }

  const formatter = getFormatterRule(input, type)
  if (typeof formatter === 'string') {
    return formatter
  }

  const createdFormat = formatter.createFormat(locale, currencyCode)
  return createdFormat.format(input)
}

export function formatCurrencyAmount({
  amount,
  locale,
  type = NumberType.TokenNonTx,
  placeholder,
}: {
  amount?: CurrencyAmount<Currency> | null | undefined
  locale: string
  type?: NumberType
  placeholder?: string
}): string {
  return formatNumber({
    input: amount ? parseFloat(amount.toFixed()) : undefined,
    locale,
    type,
    placeholder,
  })
}

export function formatNumberOrString({
  price,
  locale,
  currencyCode,
  type,
  placeholder = '-',
}: {
  price: Maybe<number | string>
  locale: string
  currencyCode?: string
  type: NumberType
  placeholder?: string
}): string {
  if (price === null || price === undefined) return placeholder
  if (typeof price === 'string')
    return formatNumber({ input: parseFloat(price), locale, currencyCode, type, placeholder })
  return formatNumber({ input: price, locale, currencyCode, type, placeholder })
}

export function formatPercent(rawPercentage: Maybe<number | string>, locale: string): string {
  if (rawPercentage === null || rawPercentage === undefined) return '-'
  const percentage =
    typeof rawPercentage === 'string'
      ? parseFloat(rawPercentage)
      : parseFloat(rawPercentage.toString())
  return formatNumber({ input: percentage / 100, type: NumberType.Percentage, locale })
}
