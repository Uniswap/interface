import { formatEther as ethersFormatEther } from '@ethersproject/units'
import { Currency, CurrencyAmount, Percent, Price } from '@uniswap/sdk-core'
import { getCurrencySymbolDisplayType } from 'constants/localCurrencies'
import usePrevious from 'hooks/usePrevious'
import { useCallback, useMemo } from 'react'
import { Bound } from 'state/mint/v3/actions'
import { DEFAULT_LOCAL_CURRENCY, FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { DEFAULT_LOCALE, Locale } from 'uniswap/src/features/language/constants'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'

type NumberFormatOptions = Intl.NumberFormatOptions

// Number formatting follows the standards laid out in this spec:
// https://www.notion.so/uniswaplabs/Number-standards-fbb9f533f10e4e22820722c2f66d23c0

const FIVE_DECIMALS_MAX_TWO_DECIMALS_MIN: NumberFormatOptions = {
  notation: 'standard',
  maximumFractionDigits: 5,
  minimumFractionDigits: 2,
}

const FIVE_DECIMALS_MAX_TWO_DECIMALS_MIN_NO_COMMAS: NumberFormatOptions = {
  notation: 'standard',
  maximumFractionDigits: 5,
  minimumFractionDigits: 2,
  useGrouping: false,
}

const NO_DECIMALS: NumberFormatOptions = {
  notation: 'standard',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
}

const NO_DECIMALS_CURRENCY: NumberFormatOptions = {
  notation: 'standard',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
  currency: 'USD',
  style: 'currency',
}

const THREE_DECIMALS_NO_TRAILING_ZEROS: NumberFormatOptions = {
  notation: 'standard',
  maximumFractionDigits: 3,
  minimumFractionDigits: 0,
}

const THREE_DECIMALS: NumberFormatOptions = {
  notation: 'standard',
  maximumFractionDigits: 3,
  minimumFractionDigits: 3,
}

const THREE_DECIMALS_CURRENCY: NumberFormatOptions = {
  notation: 'standard',
  maximumFractionDigits: 3,
  minimumFractionDigits: 3,
  currency: 'USD',
  style: 'currency',
}

const THREE_DECIMALS_NO_TRAILING_ZEROS_CURRENCY: NumberFormatOptions = {
  ...THREE_DECIMALS_NO_TRAILING_ZEROS,
  currency: 'USD',
  style: 'currency',
}

const TWO_DECIMALS_NO_TRAILING_ZEROS: NumberFormatOptions = {
  notation: 'standard',
  maximumFractionDigits: 2,
}

const TWO_DECIMALS_NO_TRAILING_ZEROS_CURRENCY: NumberFormatOptions = {
  ...TWO_DECIMALS_NO_TRAILING_ZEROS,
  currency: 'USD',
  style: 'currency',
}

const TWO_DECIMALS: NumberFormatOptions = {
  notation: 'standard',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
}

const TWO_DECIMALS_CURRENCY: NumberFormatOptions = {
  notation: 'standard',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  currency: 'USD',
  style: 'currency',
}

const EIGHT_DECIMALS_CURRENCY: NumberFormatOptions = {
  notation: 'standard',
  maximumFractionDigits: 8,
  minimumFractionDigits: 2,
  currency: 'USD',
  style: 'currency',
}

const SHORTHAND_TWO_DECIMALS: NumberFormatOptions = {
  notation: 'compact',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}

const SHORTHAND_TWO_DECIMALS_NO_TRAILING_ZEROS: NumberFormatOptions = {
  notation: 'compact',
  maximumFractionDigits: 2,
}

const SHORTHAND_TWO_DECIMALS_NO_TRAILING_ZEROS_CURRENCY: NumberFormatOptions = {
  ...SHORTHAND_TWO_DECIMALS_NO_TRAILING_ZEROS,
  currency: 'USD',
  style: 'currency',
}

const SHORTHAND_ONE_DECIMAL: NumberFormatOptions = {
  notation: 'compact',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
}

const SHORTHAND_CURRENCY_TWO_DECIMALS: NumberFormatOptions = {
  notation: 'compact',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  currency: 'USD',
  style: 'currency',
}

const SHORTHAND_CURRENCY_ONE_DECIMAL: NumberFormatOptions = {
  notation: 'compact',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  currency: 'USD',
  style: 'currency',
}

const SIX_SIG_FIGS_TWO_DECIMALS: NumberFormatOptions = {
  notation: 'standard',
  maximumSignificantDigits: 6,
  minimumSignificantDigits: 3,
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
}

const SIX_SIG_FIGS_NO_COMMAS: NumberFormatOptions = {
  notation: 'standard',
  maximumSignificantDigits: 6,
  useGrouping: false,
}

const SIX_SIG_FIGS_TWO_DECIMALS_NO_COMMAS: NumberFormatOptions = {
  notation: 'standard',
  maximumSignificantDigits: 6,
  minimumSignificantDigits: 3,
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  useGrouping: false,
}

const ONE_SIG_FIG_CURRENCY: NumberFormatOptions = {
  notation: 'standard',
  minimumSignificantDigits: 1,
  maximumSignificantDigits: 1,
  currency: 'USD',
  style: 'currency',
}

const THREE_SIG_FIGS_CURRENCY: NumberFormatOptions = {
  notation: 'standard',
  minimumSignificantDigits: 3,
  maximumSignificantDigits: 3,
  currency: 'USD',
  style: 'currency',
}

const SEVEN_SIG_FIGS__SCI_NOTATION_CURRENCY: NumberFormatOptions = {
  notation: 'scientific',
  minimumSignificantDigits: 7,
  maximumSignificantDigits: 7,
  currency: 'USD',
  style: 'currency',
}

// each rule must contain either an `upperBound` or an `exact` value.
// upperBound => number will use that formatter as long as it is < upperBound
// exact => number will use that formatter if it is === exact
// if hardcoded input is supplied it will override the input value or use the hardcoded output
type HardCodedInputFormat =
  | {
      input: number
      prefix?: string
      hardcodedOutput?: undefined
    }
  | {
      input?: undefined
      prefix?: undefined
      hardcodedOutput: string
    }

type FormatterBaseRule = { formatterOptions: NumberFormatOptions }
type FormatterExactRule = { upperBound?: undefined; exact: number } & FormatterBaseRule
type FormatterUpperBoundRule = { upperBound: number; exact?: undefined } & FormatterBaseRule

type FormatterRule = (FormatterExactRule | FormatterUpperBoundRule) & { hardCodedInput?: HardCodedInputFormat }

// these formatter objects dictate which formatter rule to use based on the interval that
// the number falls into. for example, based on the rule set below, if your number
// falls between 1 and 1e6, you'd use TWO_DECIMALS as the formatter.
const tokenNonTxFormatter: FormatterRule[] = [
  { exact: 0, formatterOptions: NO_DECIMALS },
  { upperBound: 0.001, hardCodedInput: { input: 0.001, prefix: '<' }, formatterOptions: THREE_DECIMALS },
  { upperBound: 1, formatterOptions: THREE_DECIMALS },
  { upperBound: 1e6, formatterOptions: TWO_DECIMALS },
  { upperBound: 1e15, formatterOptions: SHORTHAND_TWO_DECIMALS },
  {
    upperBound: Infinity,
    hardCodedInput: { input: 999_000_000_000_000, prefix: '>' },
    formatterOptions: SHORTHAND_TWO_DECIMALS_NO_TRAILING_ZEROS,
  },
]

const tokenQuantityStatsFormatter: FormatterRule[] = [
  // if token stat value is 0, we probably don't have the data for it, so show '-' as a placeholder
  { exact: 0, hardCodedInput: { hardcodedOutput: '-' }, formatterOptions: NO_DECIMALS },
  { upperBound: 0.01, hardCodedInput: { input: 0.01, prefix: '<' }, formatterOptions: TWO_DECIMALS },
  { upperBound: 1000, formatterOptions: TWO_DECIMALS },
  { upperBound: Infinity, formatterOptions: SHORTHAND_ONE_DECIMAL },
]

const tokenTxFormatter: FormatterRule[] = [
  { exact: 0, formatterOptions: NO_DECIMALS },
  {
    upperBound: 0.00001,
    hardCodedInput: { input: 0.00001, prefix: '<' },
    formatterOptions: FIVE_DECIMALS_MAX_TWO_DECIMALS_MIN,
  },
  { upperBound: 1, formatterOptions: FIVE_DECIMALS_MAX_TWO_DECIMALS_MIN },
  { upperBound: 10000, formatterOptions: SIX_SIG_FIGS_TWO_DECIMALS },
  { upperBound: Infinity, formatterOptions: TWO_DECIMALS },
]

const swapTradeAmountFormatter: FormatterRule[] = [
  { exact: 0, formatterOptions: NO_DECIMALS },
  { upperBound: 0.1, formatterOptions: SIX_SIG_FIGS_NO_COMMAS },
  { upperBound: 1, formatterOptions: FIVE_DECIMALS_MAX_TWO_DECIMALS_MIN_NO_COMMAS },
  { upperBound: Infinity, formatterOptions: SIX_SIG_FIGS_TWO_DECIMALS_NO_COMMAS },
]

const swapDetailsAmountFormatter: FormatterRule[] = [{ upperBound: Infinity, formatterOptions: SIX_SIG_FIGS_NO_COMMAS }]

const swapPriceFormatter: FormatterRule[] = [
  { exact: 0, formatterOptions: NO_DECIMALS },
  {
    upperBound: 0.00001,
    hardCodedInput: { input: 0.00001, prefix: '<' },
    formatterOptions: FIVE_DECIMALS_MAX_TWO_DECIMALS_MIN,
  },
  ...swapTradeAmountFormatter,
]

const fiatTokenDetailsFormatter: FormatterRule[] = [
  { exact: 0, formatterOptions: TWO_DECIMALS_CURRENCY },
  {
    upperBound: 0.00000001,
    hardCodedInput: { input: 0.00000001, prefix: '<' },
    formatterOptions: ONE_SIG_FIG_CURRENCY,
  },
  { upperBound: 0.1, formatterOptions: THREE_SIG_FIGS_CURRENCY },
  { upperBound: 1.05, formatterOptions: THREE_DECIMALS_CURRENCY },
  { upperBound: 1e6, formatterOptions: TWO_DECIMALS_CURRENCY },
  { upperBound: Infinity, formatterOptions: SHORTHAND_CURRENCY_TWO_DECIMALS },
]

const chartVolumePriceScale: FormatterRule[] = [
  {
    upperBound: 0.001,
    hardCodedInput: { input: 0.001, prefix: '<' },
    formatterOptions: ONE_SIG_FIG_CURRENCY,
  },
  { upperBound: 2, formatterOptions: TWO_DECIMALS_CURRENCY },
  { upperBound: 1000, formatterOptions: NO_DECIMALS_CURRENCY },
  { upperBound: Infinity, formatterOptions: SHORTHAND_CURRENCY_ONE_DECIMAL },
]

const chartFiatValueFormatter: FormatterRule[] = [
  // if token stat value is 0, we probably don't have the data for it, so show '-' as a placeholder
  { exact: 0, hardCodedInput: { hardcodedOutput: '-' }, formatterOptions: ONE_SIG_FIG_CURRENCY },
  { upperBound: 1.05, formatterOptions: EIGHT_DECIMALS_CURRENCY },
  { upperBound: 1e6, formatterOptions: TWO_DECIMALS_CURRENCY },
  { upperBound: Infinity, formatterOptions: SHORTHAND_CURRENCY_TWO_DECIMALS },
]

const fiatTokenPricesFormatter: FormatterRule[] = [
  { exact: 0, formatterOptions: TWO_DECIMALS_CURRENCY },
  {
    upperBound: 0.00000001,
    hardCodedInput: { input: 0.00000001, prefix: '<' },
    formatterOptions: ONE_SIG_FIG_CURRENCY,
  },
  { upperBound: 1, formatterOptions: THREE_SIG_FIGS_CURRENCY },
  { upperBound: 1e6, formatterOptions: TWO_DECIMALS_CURRENCY },
  { upperBound: 1e16, formatterOptions: SHORTHAND_CURRENCY_TWO_DECIMALS },
  { upperBound: Infinity, formatterOptions: SEVEN_SIG_FIGS__SCI_NOTATION_CURRENCY },
]

const fiatTokenStatsFormatter: FormatterRule[] = [
  // if token stat value is 0, we probably don't have the data for it, so show '-' as a placeholder
  { exact: 0, hardCodedInput: { hardcodedOutput: '-' }, formatterOptions: ONE_SIG_FIG_CURRENCY },
  { upperBound: 0.01, hardCodedInput: { input: 0.01, prefix: '<' }, formatterOptions: TWO_DECIMALS_CURRENCY },
  { upperBound: 1000, formatterOptions: TWO_DECIMALS_CURRENCY },
  { upperBound: Infinity, formatterOptions: SHORTHAND_CURRENCY_ONE_DECIMAL },
]

const fiatGasPriceFormatter: FormatterRule[] = [
  { exact: 0, formatterOptions: NO_DECIMALS_CURRENCY },
  { upperBound: 0.01, hardCodedInput: { input: 0.01, prefix: '<' }, formatterOptions: TWO_DECIMALS_CURRENCY },
  { upperBound: 1e6, formatterOptions: TWO_DECIMALS_CURRENCY },
  { upperBound: Infinity, formatterOptions: SHORTHAND_CURRENCY_TWO_DECIMALS },
]

const fiatTokenQuantityFormatter: FormatterRule[] = [
  { exact: 0, formatterOptions: TWO_DECIMALS_CURRENCY },
  ...fiatGasPriceFormatter,
]

const portfolioBalanceFormatter: FormatterRule[] = [
  { exact: 0, formatterOptions: TWO_DECIMALS_CURRENCY },
  { upperBound: Infinity, formatterOptions: TWO_DECIMALS_CURRENCY },
]

const ntfTokenFloorPriceFormatterTrailingZeros: FormatterRule[] = [
  { exact: 0, formatterOptions: NO_DECIMALS },
  { upperBound: 0.001, hardCodedInput: { input: 0.001, prefix: '<' }, formatterOptions: THREE_DECIMALS },
  { upperBound: 1, formatterOptions: THREE_DECIMALS },
  { upperBound: 1000, formatterOptions: TWO_DECIMALS },
  { upperBound: 1e15, formatterOptions: SHORTHAND_TWO_DECIMALS },
  {
    upperBound: Infinity,
    hardCodedInput: { input: 999_000_000_000_000, prefix: '>' },
    formatterOptions: SHORTHAND_TWO_DECIMALS_NO_TRAILING_ZEROS,
  },
]

const ntfTokenFloorPriceFormatter: FormatterRule[] = [
  { exact: 0, formatterOptions: NO_DECIMALS },
  { upperBound: 0.001, hardCodedInput: { input: 0.001, prefix: '<' }, formatterOptions: THREE_DECIMALS },
  { upperBound: 1, formatterOptions: THREE_DECIMALS_NO_TRAILING_ZEROS },
  { upperBound: 1000, formatterOptions: TWO_DECIMALS_NO_TRAILING_ZEROS },
  { upperBound: 1e15, formatterOptions: SHORTHAND_TWO_DECIMALS_NO_TRAILING_ZEROS },
  {
    upperBound: Infinity,
    hardCodedInput: { input: 999_000_000_000_000, prefix: '>' },
    formatterOptions: SHORTHAND_TWO_DECIMALS_NO_TRAILING_ZEROS,
  },
]

const ntfCollectionStatsFormatter: FormatterRule[] = [
  { upperBound: 1000, formatterOptions: NO_DECIMALS },
  { upperBound: Infinity, formatterOptions: SHORTHAND_ONE_DECIMAL },
]

const nftTokenFormatter: FormatterRule[] = [
  { exact: 0, hardCodedInput: { hardcodedOutput: '-' }, formatterOptions: FIVE_DECIMALS_MAX_TWO_DECIMALS_MIN },
  {
    upperBound: 0.0001,
    hardCodedInput: { input: 0.0001, prefix: '<' },
    formatterOptions: FIVE_DECIMALS_MAX_TWO_DECIMALS_MIN,
  },
  { upperBound: 1.0, formatterOptions: THREE_DECIMALS },
  { upperBound: 1000, formatterOptions: TWO_DECIMALS_NO_TRAILING_ZEROS },
  { upperBound: 1e15, formatterOptions: SHORTHAND_TWO_DECIMALS_NO_TRAILING_ZEROS },
  {
    upperBound: Infinity,
    hardCodedInput: { input: 999_000_000_000_000, prefix: '>' },
    formatterOptions: SHORTHAND_TWO_DECIMALS_NO_TRAILING_ZEROS,
  },
]

const fiatNftTokenFormatter: FormatterRule[] = [
  { exact: 0, hardCodedInput: { hardcodedOutput: '-' }, formatterOptions: NO_DECIMALS },
  {
    upperBound: 0.0001,
    hardCodedInput: { input: 0.0001, prefix: '<' },
    formatterOptions: ONE_SIG_FIG_CURRENCY,
  },
  { upperBound: 1.0, formatterOptions: THREE_DECIMALS_NO_TRAILING_ZEROS_CURRENCY },
  { upperBound: 1000, formatterOptions: TWO_DECIMALS_NO_TRAILING_ZEROS_CURRENCY },
  { upperBound: 1e15, formatterOptions: SHORTHAND_TWO_DECIMALS_NO_TRAILING_ZEROS_CURRENCY },
  {
    upperBound: Infinity,
    hardCodedInput: { input: 999_000_000_000_000, prefix: '>' },
    formatterOptions: SHORTHAND_TWO_DECIMALS_NO_TRAILING_ZEROS_CURRENCY,
  },
]

const wholeNumberFormatter: FormatterRule[] = [{ upperBound: Infinity, formatterOptions: NO_DECIMALS }]

export enum NumberType {
  // used for token quantities in non-transaction contexts (e.g. portfolio balances)
  TokenNonTx = 'token-non-tx',

  // used for token quantity stats where shorthand is okay (e.g. pool stats balances)
  TokenQuantityStats = 'token-quantity-stats',

  // used for token quantities in transaction contexts (e.g. swap, send)
  TokenTx = 'token-tx',

  // this formatter is used for displaying swap price conversions
  // below the input/output amounts
  SwapPrice = 'swap-price',

  // this formatter is only used for displaying the swap trade output amount
  // in the text input boxes. Output amounts on review screen should use the above TokenTx formatter
  SwapTradeAmount = 'swap-trade-amount',

  SwapDetailsAmount = 'swap-details-amount',

  // fiat values for price, volume, tvl, etc in a chart header or scale
  ChartFiatValue = 'chart-fiat-value',

  // fiat values for volume bar chart scales (y axis ticks)
  ChartVolumePriceScale = 'chart-volume-price-scale',

  // fiat prices in any component that belongs in the Token Details flow (except for token stats)
  FiatTokenDetails = 'fiat-token-details',

  // fiat prices everywhere except Token Details flow
  FiatTokenPrice = 'fiat-token-price',

  // fiat values for market cap, TVL, volume in the Token Details screen
  FiatTokenStats = 'fiat-token-stats',

  // fiat price of token balances
  FiatTokenQuantity = 'fiat-token-quantity',

  // fiat gas prices
  FiatGasPrice = 'fiat-gas-price',

  // portfolio balance
  PortfolioBalance = 'portfolio-balance',

  // nft floor price denominated in a token (e.g, ETH)
  NFTTokenFloorPrice = 'nft-token-floor-price',

  // nft collection stats like number of items, holder, and sales
  NFTCollectionStats = 'nft-collection-stats',

  // nft floor price with trailing zeros
  NFTTokenFloorPriceTrailingZeros = 'nft-token-floor-price-trailing-zeros',

  // nft token price in currency
  NFTToken = 'nft-token',

  // nft token price in local fiat currency
  FiatNFTToken = 'fiat-nft-token',

  // whole number formatting
  WholeNumber = 'whole-number',
}

type FormatterType = NumberType | FormatterRule[]
const TYPE_TO_FORMATTER_RULES = {
  [NumberType.TokenNonTx]: tokenNonTxFormatter,
  [NumberType.TokenQuantityStats]: tokenQuantityStatsFormatter,
  [NumberType.TokenTx]: tokenTxFormatter,
  [NumberType.SwapPrice]: swapPriceFormatter,
  [NumberType.SwapTradeAmount]: swapTradeAmountFormatter,
  [NumberType.SwapDetailsAmount]: swapDetailsAmountFormatter,
  [NumberType.FiatTokenQuantity]: fiatTokenQuantityFormatter,
  [NumberType.FiatTokenDetails]: fiatTokenDetailsFormatter,
  [NumberType.ChartFiatValue]: chartFiatValueFormatter,
  [NumberType.ChartVolumePriceScale]: chartVolumePriceScale,
  [NumberType.FiatTokenPrice]: fiatTokenPricesFormatter,
  [NumberType.FiatTokenStats]: fiatTokenStatsFormatter,
  [NumberType.FiatGasPrice]: fiatGasPriceFormatter,
  [NumberType.PortfolioBalance]: portfolioBalanceFormatter,
  [NumberType.NFTTokenFloorPrice]: ntfTokenFloorPriceFormatter,
  [NumberType.NFTTokenFloorPriceTrailingZeros]: ntfTokenFloorPriceFormatterTrailingZeros,
  [NumberType.NFTCollectionStats]: ntfCollectionStatsFormatter,
  [NumberType.NFTToken]: nftTokenFormatter,
  [NumberType.FiatNFTToken]: fiatNftTokenFormatter,
  [NumberType.WholeNumber]: wholeNumberFormatter,
}

function getFormatterRule(input: number, type: FormatterType, conversionRate?: number): FormatterRule {
  const rules = Array.isArray(type) ? type : TYPE_TO_FORMATTER_RULES[type]
  for (const rule of rules) {
    const shouldConvertInput = rule.formatterOptions.currency && conversionRate
    const convertedInput = shouldConvertInput ? input * conversionRate : input

    if (
      (rule.exact !== undefined && convertedInput === rule.exact) ||
      (rule.upperBound !== undefined && convertedInput < rule.upperBound)
    ) {
      return rule
    }
  }

  throw new Error(`formatter for type ${type} not configured correctly for value ${input}`)
}

interface FormatNumberOptions {
  input: Maybe<number>
  type?: FormatterType
  placeholder?: string
  locale?: Locale
  localCurrency?: FiatCurrency
  conversionRate?: number
  forceShowCurrencySymbol?: boolean
}

function formatNumber({
  input,
  type = NumberType.TokenNonTx,
  placeholder = '-',
  locale = DEFAULT_LOCALE,
  localCurrency = DEFAULT_LOCAL_CURRENCY,
  conversionRate,
  forceShowCurrencySymbol = false,
}: FormatNumberOptions): string {
  if (input === null || input === undefined) {
    if (forceShowCurrencySymbol) {
      const parts = new Intl.NumberFormat(locale, { style: 'currency', currency: localCurrency }).formatToParts(0)
      const currencySymbol = parts.find((part) => part.type === 'currency')?.value
      const isSymbolBeforeNumber = parts[0].type === 'currency'

      return isSymbolBeforeNumber ? `${currencySymbol}${placeholder}` : `${placeholder}${currencySymbol}`
    }

    return placeholder
  }

  const { hardCodedInput, formatterOptions } = getFormatterRule(input, type, conversionRate)

  if (formatterOptions.currency) {
    input = conversionRate ? input * conversionRate : input
    formatterOptions.currency = localCurrency
    formatterOptions.currencyDisplay = getCurrencySymbolDisplayType(localCurrency)
  }

  if (!hardCodedInput) {
    return new Intl.NumberFormat(locale, formatterOptions).format(input)
  }

  if (hardCodedInput.hardcodedOutput) {
    return hardCodedInput.hardcodedOutput
  }

  const { input: hardCodedInputValue, prefix } = hardCodedInput
  if (hardCodedInputValue === undefined) {
    return placeholder
  }
  return (prefix ?? '') + new Intl.NumberFormat(locale, formatterOptions).format(hardCodedInputValue)
}

interface FormatCurrencyAmountOptions {
  amount: Maybe<CurrencyAmount<Currency>>
  type?: FormatterType
  placeholder?: string
  locale?: Locale
  localCurrency?: FiatCurrency
  conversionRate?: number
}

export function formatCurrencyAmount({
  amount,
  type = NumberType.TokenNonTx,
  placeholder,
  locale = DEFAULT_LOCALE,
  localCurrency = DEFAULT_LOCAL_CURRENCY,
  conversionRate,
}: FormatCurrencyAmountOptions): string {
  return formatNumber({
    input: amount ? parseFloat(amount.toSignificant()) : undefined,
    type,
    placeholder,
    locale,
    localCurrency,
    conversionRate,
  })
}

function formatPercent(percent: Percent | undefined, maxDecimals = 3, locale: Locale = DEFAULT_LOCALE) {
  if (!percent) {
    return '-'
  }

  return `${Number(percent.toFixed(maxDecimals)).toLocaleString(locale, {
    maximumFractionDigits: maxDecimals,
    useGrouping: false,
  })}%`
}

// Used to format floats representing percent change with fixed decimal places
function formatDelta(delta: Maybe<number>, locale: Locale = DEFAULT_LOCALE) {
  if (delta === null || delta === undefined || delta === Infinity || isNaN(delta)) {
    return '-'
  }

  return `${Number(Math.abs(delta).toFixed(2)).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  })}%`
}

interface FormatPriceOptions {
  price: Maybe<Price<Currency, Currency>>
  type?: FormatterType
  locale?: Locale
  localCurrency?: FiatCurrency
  conversionRate?: number
}

function formatPrice({
  price,
  type = NumberType.FiatTokenPrice,
  locale = DEFAULT_LOCALE,
  localCurrency = DEFAULT_LOCAL_CURRENCY,
  conversionRate,
}: FormatPriceOptions): string {
  if (price === null || price === undefined) {
    return '-'
  }

  return formatNumber({
    input: parseFloat(price.toSignificant()),
    type,
    locale,
    localCurrency,
    conversionRate,
  })
}

interface FormatTickPriceOptions {
  price?: Price<Currency, Currency>
  atLimit: { [bound in Bound]?: boolean | undefined }
  direction: Bound
  placeholder?: string
  numberType?: NumberType
  locale?: Locale
  localCurrency?: FiatCurrency
  conversionRate?: number
}

function formatTickPrice({
  price,
  atLimit,
  direction,
  placeholder,
  numberType,
  locale,
  localCurrency,
  conversionRate,
}: FormatTickPriceOptions) {
  if (atLimit[direction]) {
    return direction === Bound.LOWER ? '0' : '∞'
  }

  if (!price && placeholder !== undefined) {
    return placeholder
  }

  return formatPrice({ price, type: numberType ?? NumberType.TokenNonTx, locale, localCurrency, conversionRate })
}

interface FormatNumberOrStringOptions {
  input: Maybe<number | string>
  type: FormatterType
  locale?: Locale
  localCurrency?: FiatCurrency
  conversionRate?: number
}

function formatNumberOrString({
  input,
  type,
  locale,
  localCurrency,
  conversionRate,
}: FormatNumberOrStringOptions): string {
  if (input === null || input === undefined) {
    return '-'
  }
  if (typeof input === 'string') {
    return formatNumber({ input: parseFloat(input), type, locale, localCurrency, conversionRate })
  }
  return formatNumber({ input, type, locale, localCurrency, conversionRate })
}

interface FormatEtherOptions {
  input: Maybe<number | string>
  type: FormatterType
  locale?: Locale
  localCurrency?: FiatCurrency
}

function formatEther({ input, type, locale, localCurrency }: FormatEtherOptions) {
  if (input === null || input === undefined) {
    return '-'
  }
  return formatNumber({ input: parseFloat(ethersFormatEther(input.toString())), type, locale, localCurrency })
}

interface FormatFiatPriceOptions {
  price: Maybe<number | string>
  type?: FormatterType
  locale?: Locale
  localCurrency?: FiatCurrency
  conversionRate?: number
}

function formatFiatPrice({
  price,
  type = NumberType.FiatTokenPrice,
  locale,
  localCurrency,
  conversionRate,
}: FormatFiatPriceOptions): string {
  return formatNumberOrString({ input: price, type, locale, localCurrency, conversionRate })
}

const MAX_AMOUNT_STR_LENGTH = 9

function formatReviewSwapCurrencyAmount(amount: CurrencyAmount<Currency>, locale: Locale = DEFAULT_LOCALE): string {
  let formattedAmount = formatCurrencyAmount({ amount, type: NumberType.TokenTx, locale })
  if (formattedAmount.length > MAX_AMOUNT_STR_LENGTH) {
    formattedAmount = formatCurrencyAmount({ amount, type: NumberType.SwapTradeAmount, locale })
  }
  return formattedAmount
}

function handleFallbackCurrency(
  selectedCurrency: FiatCurrency,
  previousSelectedCurrency: FiatCurrency | undefined,
  previousConversionRate: number | undefined,
  shouldFallbackToUSD: boolean,
  shouldFallbackToPrevious: boolean,
) {
  if (shouldFallbackToUSD) {
    return DEFAULT_LOCAL_CURRENCY
  }
  if (shouldFallbackToPrevious) {
    return previousConversionRate ? previousSelectedCurrency : DEFAULT_LOCAL_CURRENCY
  }
  return selectedCurrency
}

// Constructs an object that injects the correct locale and local currency into each of the above formatter functions.
export function useFormatter() {
  const activeLocale = useCurrentLocale()
  const activeLocalCurrency = useAppFiatCurrency()
  const { convertFiatAmount, conversionRate: localCurrencyConversionRate } = useLocalizationContext()

  const previousSelectedCurrency = usePrevious(activeLocalCurrency)
  const previousConversionRate = usePrevious(localCurrencyConversionRate)

  const shouldFallbackToPrevious = !localCurrencyConversionRate
  const shouldFallbackToUSD = !localCurrencyConversionRate
  const currencyToFormatWith = handleFallbackCurrency(
    activeLocalCurrency,
    previousSelectedCurrency,
    previousConversionRate,
    shouldFallbackToUSD,
    shouldFallbackToPrevious,
  )
  const localCurrencyConversionRateToFormatWith = shouldFallbackToPrevious
    ? previousConversionRate
    : localCurrencyConversionRate

  type LocalesType = 'locale' | 'localCurrency' | 'conversionRate'
  const formatNumberWithLocales = useCallback(
    (options: Omit<FormatNumberOptions, LocalesType>) =>
      formatNumber({
        ...options,
        locale: activeLocale,
        localCurrency: currencyToFormatWith,
        conversionRate: localCurrencyConversionRateToFormatWith,
      }),
    [currencyToFormatWith, activeLocale, localCurrencyConversionRateToFormatWith],
  )

  const formatCurrencyAmountWithLocales = useCallback(
    (options: Omit<FormatCurrencyAmountOptions, LocalesType>) =>
      formatCurrencyAmount({
        ...options,
        locale: activeLocale,
        localCurrency: currencyToFormatWith,
        conversionRate: localCurrencyConversionRateToFormatWith,
      }),
    [currencyToFormatWith, activeLocale, localCurrencyConversionRateToFormatWith],
  )

  const formatPriceWithLocales = useCallback(
    (options: Omit<FormatPriceOptions, LocalesType>) =>
      formatPrice({
        ...options,
        locale: activeLocale,
        localCurrency: currencyToFormatWith,
        conversionRate: localCurrencyConversionRateToFormatWith,
      }),
    [currencyToFormatWith, activeLocale, localCurrencyConversionRateToFormatWith],
  )

  const formatReviewSwapCurrencyAmountWithLocales = useCallback(
    (amount: CurrencyAmount<Currency>) => formatReviewSwapCurrencyAmount(amount, activeLocale),
    [activeLocale],
  )

  const formatTickPriceWithLocales = useCallback(
    (options: Omit<FormatTickPriceOptions, LocalesType>) =>
      formatTickPrice({
        ...options,
        locale: activeLocale,
        localCurrency: currencyToFormatWith,
        conversionRate: localCurrencyConversionRateToFormatWith,
      }),
    [currencyToFormatWith, activeLocale, localCurrencyConversionRateToFormatWith],
  )

  const formatNumberOrStringWithLocales = useCallback(
    (options: Omit<FormatNumberOrStringOptions, LocalesType>) =>
      formatNumberOrString({
        ...options,
        locale: activeLocale,
        localCurrency: currencyToFormatWith,
        conversionRate: localCurrencyConversionRateToFormatWith,
      }),
    [currencyToFormatWith, activeLocale, localCurrencyConversionRateToFormatWith],
  )

  const formatFiatPriceWithLocales = useCallback(
    (options: Omit<FormatFiatPriceOptions, LocalesType>) =>
      formatFiatPrice({
        ...options,
        locale: activeLocale,
        localCurrency: currencyToFormatWith,
        conversionRate: localCurrencyConversionRateToFormatWith,
      }),
    [currencyToFormatWith, activeLocale, localCurrencyConversionRateToFormatWith],
  )

  const formatDeltaWithLocales = useCallback(
    (percent: Maybe<number>) => formatDelta(percent, activeLocale),
    [activeLocale],
  )

  const formatPercentWithLocales = useCallback(
    (percent: Percent | undefined, maxDecimals?: number) => formatPercent(percent, maxDecimals, activeLocale),
    [activeLocale],
  )

  const formatEtherwithLocales = useCallback(
    (options: Omit<FormatEtherOptions, LocalesType>) =>
      formatEther({
        ...options,
        locale: activeLocale,
        localCurrency: currencyToFormatWith,
      }),
    [currencyToFormatWith, activeLocale],
  )

  const formatConvertedFiatNumberOrString = useCallback(
    (options: Omit<FormatNumberOrStringOptions, LocalesType>) =>
      formatNumberOrString({
        ...options,
        locale: activeLocale,
        localCurrency: currencyToFormatWith,
        conversionRate: undefined,
      }),
    [currencyToFormatWith, activeLocale],
  )

  return useMemo(
    () => ({
      convertToFiatAmount: convertFiatAmount,
      formatConvertedFiatNumberOrString,
      formatCurrencyAmount: formatCurrencyAmountWithLocales,
      formatEther: formatEtherwithLocales,
      formatFiatPrice: formatFiatPriceWithLocales,
      formatNumber: formatNumberWithLocales,
      formatNumberOrString: formatNumberOrStringWithLocales,
      formatDelta: formatDeltaWithLocales,
      formatPercent: formatPercentWithLocales,
      formatPrice: formatPriceWithLocales,
      formatReviewSwapCurrencyAmount: formatReviewSwapCurrencyAmountWithLocales,
      formatTickPrice: formatTickPriceWithLocales,
    }),
    [
      convertFiatAmount,
      formatConvertedFiatNumberOrString,
      formatCurrencyAmountWithLocales,
      formatDeltaWithLocales,
      formatEtherwithLocales,
      formatFiatPriceWithLocales,
      formatNumberOrStringWithLocales,
      formatNumberWithLocales,
      formatPercentWithLocales,
      formatPriceWithLocales,
      formatReviewSwapCurrencyAmountWithLocales,
      formatTickPriceWithLocales,
    ],
  )
}
