import { Currency, CurrencyAmount, Percent, Price } from '@uniswap/sdk-core'
import {
  DEFAULT_LOCAL_CURRENCY,
  LOCAL_CURRENCY_SYMBOL_DISPLAY_TYPE,
  SupportedLocalCurrency,
} from 'constants/localCurrencies'
import { DEFAULT_LOCALE, SupportedLocale } from 'constants/locales'
import { useCurrencyConversionFlagEnabled } from 'featureFlags/flags/currencyConversion'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useCallback, useMemo } from 'react'

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
  [NumberType.NFTTokenFloorPriceTrailingZeros]: ntfTokenFloorPriceFormatterTrailingZeros,
  [NumberType.NFTCollectionStats]: ntfCollectionStatsFormatter,
}

function getFormatterRule(input: number, type: NumberType): FormatterRule {
  const rules = TYPE_TO_FORMATTER_RULES[type]
  for (const rule of rules) {
    if (
      (rule.exact !== undefined && input === rule.exact) ||
      (rule.upperBound !== undefined && input < rule.upperBound)
    ) {
      return rule
    }
  }

  throw new Error(`formatter for type ${type} not configured correctly`)
}

interface FormatNumberOptions {
  input: Nullish<number>
  type?: NumberType
  placeholder?: string
  locale?: SupportedLocale
  localCurrency?: SupportedLocalCurrency
}

export function formatNumber({
  input,
  type = NumberType.TokenNonTx,
  placeholder = '-',
  locale = DEFAULT_LOCALE,
  localCurrency = DEFAULT_LOCAL_CURRENCY,
}: FormatNumberOptions): string {
  if (input === null || input === undefined) {
    return placeholder
  }

  const { hardCodedInput, formatterOptions } = getFormatterRule(input, type)

  if (formatterOptions.currency) {
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

export function formatCurrencyAmount(
  amount: Nullish<CurrencyAmount<Currency>>,
  type: NumberType = NumberType.TokenNonTx,
  placeholder?: string
): string {
  return formatNumber({ input: amount ? parseFloat(amount.toSignificant()) : undefined, type, placeholder })
}

export function formatPriceImpact(priceImpact: Percent | undefined): string {
  if (!priceImpact) return '-'

  return `${priceImpact.multiply(-1).toFixed(3)}%`
}

export function formatSlippage(slippage: Percent | undefined) {
  if (!slippage) return '-'

  return `${slippage.toFixed(3)}%`
}

export function formatPrice(
  price: Nullish<Price<Currency, Currency>>,
  type: NumberType = NumberType.FiatTokenPrice
): string {
  if (price === null || price === undefined) {
    return '-'
  }

  return formatNumber({ input: parseFloat(price.toSignificant()), type })
}

export function formatNumberOrString(price: Nullish<number | string>, type: NumberType): string {
  if (price === null || price === undefined) return '-'
  if (typeof price === 'string') return formatNumber({ input: parseFloat(price), type })
  return formatNumber({ input: price, type })
}

export function formatUSDPrice(price: Nullish<number | string>, type: NumberType = NumberType.FiatTokenPrice): string {
  return formatNumberOrString(price, type)
}

/** Formats USD and non-USD prices */
export function formatFiatPrice(price: Nullish<number>, currency = 'USD'): string {
  if (price === null || price === undefined) return '-'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price)
}

// Convert [CurrencyAmount] to number with necessary precision for price formatting.
export const currencyAmountToPreciseFloat = (currencyAmount: CurrencyAmount<Currency> | undefined) => {
  if (!currencyAmount) return undefined
  const floatForLargerNumbers = parseFloat(currencyAmount.toExact())
  if (floatForLargerNumbers < 0.1) {
    return parseFloat(currencyAmount.toSignificant(6))
  }
  return floatForLargerNumbers
}

// Convert [Price] to number with necessary precision for price formatting.
export const priceToPreciseFloat = (price: Price<Currency, Currency> | undefined) => {
  if (!price) return undefined
  const floatForLargerNumbers = parseFloat(price.toFixed(9))
  if (floatForLargerNumbers < 0.1) {
    return parseFloat(price.toSignificant(6))
  }
  return floatForLargerNumbers
}

/**
 * Returns a numerical amount of any token formatted in human readable string for use in template.
 *
 * For transaction review numbers, such as token quantities, NFT price (token-denominated),
 *  network fees, transaction history items. Adheres to guidelines defined here:
 * https://www.notion.so/uniswaplabs/Number-standards-fbb9f533f10e4e22820722c2f66d23c0
 * @param num numerical value denominated in any token
 * @param maxDigits the maximum number of digits that should be shown for the quantity
 */
export const formatTransactionAmount = (num: number | undefined | null, maxDigits = 9) => {
  if (num === 0) return '0.00'
  if (!num) return ''
  if (num < 0.00001) {
    return '<0.00001'
  }
  if (num >= 0.00001 && num < 1) {
    return `${Number(num.toFixed(5)).toLocaleString(DEFAULT_LOCALE, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 5,
    })}`
  }
  if (num >= 1 && num < 10000) {
    return `${Number(num.toPrecision(6)).toLocaleString(DEFAULT_LOCALE, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    })}`
  }
  if (num >= 10000 && num < 1000000) {
    return `${Number(num.toFixed(2)).toLocaleString(DEFAULT_LOCALE, { minimumFractionDigits: 2 })}`
  }
  // For very large numbers, switch to scientific notation and show as much precision
  // as permissible by maxDigits param.
  if (num >= Math.pow(10, maxDigits - 1)) {
    return `${num.toExponential(maxDigits - 3)}`
  }
  return `${Number(num.toFixed(2)).toLocaleString(DEFAULT_LOCALE, { minimumFractionDigits: 2 })}`
}

const MAX_AMOUNT_STR_LENGTH = 9

export function formatReviewSwapCurrencyAmount(amount: CurrencyAmount<Currency>): string {
  let formattedAmount = formatCurrencyAmount(amount, NumberType.TokenTx)
  if (formattedAmount.length > MAX_AMOUNT_STR_LENGTH) {
    formattedAmount = formatCurrencyAmount(amount, NumberType.SwapTradeAmount)
  }
  return formattedAmount
}

function useFormatterLocales(): {
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

// Constructs an object that injects the correct locale and local currency into each of the above formatter functions.
export function useFormatter() {
  const { formatterLocale, formatterLocalCurrency } = useFormatterLocales()

  const formatNumberWithLocales = useCallback(
    (options: Omit<FormatNumberOptions, 'locale' | 'localCurrency'>) =>
      formatNumber({ ...options, locale: formatterLocale, localCurrency: formatterLocalCurrency }),
    [formatterLocalCurrency, formatterLocale]
  )

  return useMemo(
    () => ({
      formatNumber: formatNumberWithLocales,
    }),
    [formatNumberWithLocales]
  )
}
