import { Currency, CurrencyAmount, Percent, Price, Token } from '@uniswap/sdk-core'
import {
  DEFAULT_LOCAL_CURRENCY,
  LOCAL_CURRENCY_SYMBOL_DISPLAY_TYPE,
  SupportedLocalCurrency,
} from 'constants/localCurrencies'
import { DEFAULT_LOCALE, SupportedLocale } from 'constants/locales'
import { useCurrencyConversionFlagEnabled } from 'featureFlags/flags/currencyConversion'
import { Currency as GqlCurrency } from 'graphql/data/__generated__/types-and-hooks'
import { useLocalCurrencyConversionRate } from 'graphql/data/ConversionRate'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { useActiveLocale } from 'hooks/useActiveLocale'
import usePrevious from 'hooks/usePrevious'
import { useCallback, useMemo } from 'react'
import { Bound } from 'state/mint/v3/actions'

type Nullish<T> = T | null | undefined
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

const TWO_DECIMALS_NO_TRAILING_ZEROS: NumberFormatOptions = {
  notation: 'standard',
  maximumFractionDigits: 2,
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

const SHORTHAND_TWO_DECIMALS: NumberFormatOptions = {
  notation: 'compact',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}

const SHORTHAND_TWO_DECIMALS_NO_TRAILING_ZEROS: NumberFormatOptions = {
  notation: 'compact',
  maximumFractionDigits: 2,
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
// if hardcodedinput is supplied it will override the input value or use the hardcoded output
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
  { exact: 0, formatterOptions: TWO_DECIMALS_CURRENCY },
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

export enum NumberType {
  // used for token quantities in non-transaction contexts (e.g. portfolio balances)
  TokenNonTx = 'token-non-tx',

  // used for token quantities in transaction contexts (e.g. swap, send)
  TokenTx = 'token-tx',

  // this formatter is used for displaying swap price conversions
  // below the input/output amounts
  SwapPrice = 'swap-price',

  // this formatter is only used for displaying the swap trade output amount
  // in the text input boxes. Output amounts on review screen should use the above TokenTx formatter
  SwapTradeAmount = 'swap-trade-amount',

  SwapDetailsAmount = 'swap-details-amount',

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
}

type FormatterType = NumberType | FormatterRule[]
const TYPE_TO_FORMATTER_RULES = {
  [NumberType.TokenNonTx]: tokenNonTxFormatter,
  [NumberType.TokenTx]: tokenTxFormatter,
  [NumberType.SwapPrice]: swapPriceFormatter,
  [NumberType.SwapTradeAmount]: swapTradeAmountFormatter,
  [NumberType.SwapDetailsAmount]: swapDetailsAmountFormatter,
  [NumberType.FiatTokenQuantity]: fiatTokenQuantityFormatter,
  [NumberType.FiatTokenDetails]: fiatTokenDetailsFormatter,
  [NumberType.FiatTokenPrice]: fiatTokenPricesFormatter,
  [NumberType.FiatTokenStats]: fiatTokenStatsFormatter,
  [NumberType.FiatGasPrice]: fiatGasPriceFormatter,
  [NumberType.PortfolioBalance]: portfolioBalanceFormatter,
  [NumberType.NFTTokenFloorPrice]: ntfTokenFloorPriceFormatter,
  [NumberType.NFTTokenFloorPriceTrailingZeros]: ntfTokenFloorPriceFormatterTrailingZeros,
  [NumberType.NFTCollectionStats]: ntfCollectionStatsFormatter,
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

  throw new Error(`formatter for type ${type} not configured correctly`)
}

interface FormatNumberOptions {
  input: Nullish<number>
  type?: FormatterType
  placeholder?: string
  locale?: SupportedLocale
  localCurrency?: SupportedLocalCurrency
  conversionRate?: number
}

function formatNumber({
  input,
  type = NumberType.TokenNonTx,
  placeholder = '-',
  locale = DEFAULT_LOCALE,
  localCurrency = DEFAULT_LOCAL_CURRENCY,
  conversionRate,
}: FormatNumberOptions): string {
  if (input === null || input === undefined) {
    return placeholder
  }

  const { hardCodedInput, formatterOptions } = getFormatterRule(input, type, conversionRate)

  if (formatterOptions.currency) {
    input = conversionRate ? input * conversionRate : input
    formatterOptions.currency = localCurrency
    formatterOptions.currencyDisplay = LOCAL_CURRENCY_SYMBOL_DISPLAY_TYPE[localCurrency]
  }

  if (!hardCodedInput) {
    return new Intl.NumberFormat(locale, formatterOptions).format(input)
  }

  if (hardCodedInput.hardcodedOutput) {
    return hardCodedInput.hardcodedOutput
  }

  const { input: hardCodedInputValue, prefix } = hardCodedInput
  if (hardCodedInputValue === undefined) return placeholder
  return (prefix ?? '') + new Intl.NumberFormat(locale, formatterOptions).format(hardCodedInputValue)
}

interface FormatCurrencyAmountOptions {
  amount: Nullish<CurrencyAmount<Currency>>
  type?: FormatterType
  placeholder?: string
  locale?: SupportedLocale
  localCurrency?: SupportedLocalCurrency
  conversionRate?: number
}

function formatCurrencyAmount({
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

function formatPriceImpact(priceImpact: Percent | undefined, locale: SupportedLocale = DEFAULT_LOCALE): string {
  if (!priceImpact) return '-'

  return `${Number(priceImpact.multiply(-1).toFixed(3)).toLocaleString(locale, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
    useGrouping: false,
  })}%`
}

function formatSlippage(slippage: Percent | undefined, locale: SupportedLocale = DEFAULT_LOCALE) {
  if (!slippage) return '-'

  return `${Number(slippage.toFixed(3)).toLocaleString(locale, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
    useGrouping: false,
  })}%`
}

function formatPercent(percent: Nullish<number>, locale: SupportedLocale = DEFAULT_LOCALE) {
  if (percent === null || percent === undefined || percent === Infinity || isNaN(percent)) {
    return '-'
  }

  return `${Number(Math.abs(percent).toFixed(2)).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  })}%`
}

interface FormatPriceOptions {
  price: Nullish<Price<Currency, Currency>>
  type: FormatterType
  locale?: SupportedLocale
  localCurrency?: SupportedLocalCurrency
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

  return formatNumber({ input: parseFloat(price.toSignificant()), type, locale, localCurrency, conversionRate })
}

interface FormatTickPriceOptions {
  price?: Price<Token, Token>
  atLimit: { [bound in Bound]?: boolean | undefined }
  direction: Bound
  placeholder?: string
  numberType?: NumberType
  locale?: SupportedLocale
  localCurrency?: SupportedLocalCurrency
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
  input: Nullish<number | string>
  type: FormatterType
  locale?: SupportedLocale
  localCurrency?: SupportedLocalCurrency
  conversionRate?: number
}

function formatNumberOrString({
  input,
  type,
  locale,
  localCurrency,
  conversionRate,
}: FormatNumberOrStringOptions): string {
  if (input === null || input === undefined) return '-'
  if (typeof input === 'string')
    return formatNumber({ input: parseFloat(input), type, locale, localCurrency, conversionRate })
  return formatNumber({ input, type, locale, localCurrency, conversionRate })
}

interface FormatFiatPriceOptions {
  price: Nullish<number | string>
  type?: FormatterType
  locale?: SupportedLocale
  localCurrency?: SupportedLocalCurrency
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

function formatReviewSwapCurrencyAmount(
  amount: CurrencyAmount<Currency>,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  let formattedAmount = formatCurrencyAmount({ amount, type: NumberType.TokenTx, locale })
  if (formattedAmount.length > MAX_AMOUNT_STR_LENGTH) {
    formattedAmount = formatCurrencyAmount({ amount, type: NumberType.SwapTradeAmount, locale })
  }
  return formattedAmount
}

export function useFormatterLocales(): {
  formatterLocale: SupportedLocale
  formatterLocalCurrency: SupportedLocalCurrency
} {
  const currencyConversionEnabled = useCurrencyConversionFlagEnabled()
  const activeLocale = useActiveLocale()
  const activeLocalCurrency = useActiveLocalCurrency()

  if (currencyConversionEnabled) {
    return {
      formatterLocale: activeLocale,
      formatterLocalCurrency: activeLocalCurrency,
    }
  }

  return {
    formatterLocale: DEFAULT_LOCALE,
    formatterLocalCurrency: DEFAULT_LOCAL_CURRENCY,
  }
}

function handleFallbackCurrency(
  selectedCurrency: SupportedLocalCurrency,
  previousSelectedCurrency: SupportedLocalCurrency | undefined,
  previousConversionRate: number | undefined,
  shouldFallbackToUSD: boolean,
  shouldFallbackToPrevious: boolean
) {
  if (shouldFallbackToUSD) return DEFAULT_LOCAL_CURRENCY
  if (shouldFallbackToPrevious) return previousConversionRate ? previousSelectedCurrency : DEFAULT_LOCAL_CURRENCY
  return selectedCurrency
}

// Constructs an object that injects the correct locale and local currency into each of the above formatter functions.
export function useFormatter() {
  const { formatterLocale, formatterLocalCurrency } = useFormatterLocales()

  const formatterLocalCurrencyIsUSD = formatterLocalCurrency === GqlCurrency.Usd
  const { data: localCurrencyConversionRate, isLoading: localCurrencyConversionRateIsLoading } =
    useLocalCurrencyConversionRate(formatterLocalCurrency, formatterLocalCurrencyIsUSD)

  const previousSelectedCurrency = usePrevious(formatterLocalCurrency)
  const previousConversionRate = usePrevious(localCurrencyConversionRate)

  const shouldFallbackToPrevious = !localCurrencyConversionRate && localCurrencyConversionRateIsLoading
  const shouldFallbackToUSD = !localCurrencyConversionRate && !localCurrencyConversionRateIsLoading
  const currencyToFormatWith = handleFallbackCurrency(
    formatterLocalCurrency,
    previousSelectedCurrency,
    previousConversionRate,
    shouldFallbackToUSD,
    shouldFallbackToPrevious
  )
  const localCurrencyConversionRateToFormatWith = shouldFallbackToPrevious
    ? previousConversionRate
    : localCurrencyConversionRate

  type LocalesType = 'locale' | 'localCurrency' | 'conversionRate'
  const formatNumberWithLocales = useCallback(
    (options: Omit<FormatNumberOptions, LocalesType>) =>
      formatNumber({
        ...options,
        locale: formatterLocale,
        localCurrency: currencyToFormatWith,
        conversionRate: localCurrencyConversionRateToFormatWith,
      }),
    [currencyToFormatWith, formatterLocale, localCurrencyConversionRateToFormatWith]
  )

  const formatCurrencyAmountWithLocales = useCallback(
    (options: Omit<FormatCurrencyAmountOptions, LocalesType>) =>
      formatCurrencyAmount({
        ...options,
        locale: formatterLocale,
        localCurrency: currencyToFormatWith,
        conversionRate: localCurrencyConversionRateToFormatWith,
      }),
    [currencyToFormatWith, formatterLocale, localCurrencyConversionRateToFormatWith]
  )

  const formatPriceWithLocales = useCallback(
    (options: Omit<FormatPriceOptions, LocalesType>) =>
      formatPrice({
        ...options,
        locale: formatterLocale,
        localCurrency: currencyToFormatWith,
        conversionRate: localCurrencyConversionRateToFormatWith,
      }),
    [currencyToFormatWith, formatterLocale, localCurrencyConversionRateToFormatWith]
  )

  const formatPriceImpactWithLocales = useCallback(
    (priceImpact: Percent | undefined) => formatPriceImpact(priceImpact, formatterLocale),
    [formatterLocale]
  )

  const formatReviewSwapCurrencyAmountWithLocales = useCallback(
    (amount: CurrencyAmount<Currency>) => formatReviewSwapCurrencyAmount(amount, formatterLocale),
    [formatterLocale]
  )

  const formatSlippageWithLocales = useCallback(
    (slippage: Percent | undefined) => formatSlippage(slippage, formatterLocale),
    [formatterLocale]
  )

  const formatTickPriceWithLocales = useCallback(
    (options: Omit<FormatTickPriceOptions, LocalesType>) =>
      formatTickPrice({
        ...options,
        locale: formatterLocale,
        localCurrency: currencyToFormatWith,
        conversionRate: localCurrencyConversionRateToFormatWith,
      }),
    [currencyToFormatWith, formatterLocale, localCurrencyConversionRateToFormatWith]
  )

  const formatNumberOrStringWithLocales = useCallback(
    (options: Omit<FormatNumberOrStringOptions, LocalesType>) =>
      formatNumberOrString({
        ...options,
        locale: formatterLocale,
        localCurrency: currencyToFormatWith,
        conversionRate: localCurrencyConversionRateToFormatWith,
      }),
    [currencyToFormatWith, formatterLocale, localCurrencyConversionRateToFormatWith]
  )

  const formatFiatPriceWithLocales = useCallback(
    (options: Omit<FormatFiatPriceOptions, LocalesType>) =>
      formatFiatPrice({
        ...options,
        locale: formatterLocale,
        localCurrency: currencyToFormatWith,
        conversionRate: localCurrencyConversionRateToFormatWith,
      }),
    [currencyToFormatWith, formatterLocale, localCurrencyConversionRateToFormatWith]
  )

  const formatPercentWithLocales = useCallback(
    (percent: Nullish<number>) => formatPercent(percent, formatterLocale),
    [formatterLocale]
  )

  return useMemo(
    () => ({
      formatCurrencyAmount: formatCurrencyAmountWithLocales,
      formatFiatPrice: formatFiatPriceWithLocales,
      formatNumber: formatNumberWithLocales,
      formatNumberOrString: formatNumberOrStringWithLocales,
      formatPercent: formatPercentWithLocales,
      formatPrice: formatPriceWithLocales,
      formatPriceImpact: formatPriceImpactWithLocales,
      formatReviewSwapCurrencyAmount: formatReviewSwapCurrencyAmountWithLocales,
      formatSlippage: formatSlippageWithLocales,
      formatTickPrice: formatTickPriceWithLocales,
    }),
    [
      formatCurrencyAmountWithLocales,
      formatFiatPriceWithLocales,
      formatNumberOrStringWithLocales,
      formatNumberWithLocales,
      formatPercentWithLocales,
      formatPriceImpactWithLocales,
      formatPriceWithLocales,
      formatReviewSwapCurrencyAmountWithLocales,
      formatSlippageWithLocales,
      formatTickPriceWithLocales,
    ]
  )
}
