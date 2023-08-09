import { Currency, CurrencyAmount, Percent, Price } from '@uniswap/sdk-core'
import { DEFAULT_LOCALE } from 'constants/locales'

type Nullish<T> = T | null | undefined

// Number formatting follows the standards laid out in this spec:
// https://www.notion.so/uniswaplabs/Number-standards-fbb9f533f10e4e22820722c2f66d23c0

const FIVE_DECIMALS_MAX_TWO_DECIMALS_MIN = new Intl.NumberFormat('en-US', {
  notation: 'standard',
  maximumFractionDigits: 5,
  minimumFractionDigits: 2,
})

const FIVE_DECIMALS_MAX_TWO_DECIMALS_MIN_NO_COMMAS = new Intl.NumberFormat('en-US', {
  notation: 'standard',
  maximumFractionDigits: 5,
  minimumFractionDigits: 2,
  useGrouping: false,
})

const NO_DECIMALS = new Intl.NumberFormat('en-US', {
  notation: 'standard',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})

const THREE_DECIMALS_NO_TRAILING_ZEROS = new Intl.NumberFormat('en-US', {
  notation: 'standard',
  maximumFractionDigits: 3,
  minimumFractionDigits: 0,
})

const THREE_DECIMALS = new Intl.NumberFormat('en-US', {
  notation: 'standard',
  maximumFractionDigits: 3,
  minimumFractionDigits: 3,
})

const THREE_DECIMALS_USD = new Intl.NumberFormat('en-US', {
  notation: 'standard',
  maximumFractionDigits: 3,
  minimumFractionDigits: 3,
  currency: 'USD',
  style: 'currency',
})

const TWO_DECIMALS_NO_TRAILING_ZEROS = new Intl.NumberFormat('en-US', {
  notation: 'standard',
  maximumFractionDigits: 2,
})

const TWO_DECIMALS = new Intl.NumberFormat('en-US', {
  notation: 'standard',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
})

const TWO_DECIMALS_USD = new Intl.NumberFormat('en-US', {
  notation: 'standard',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  currency: 'USD',
  style: 'currency',
})

const SHORTHAND_TWO_DECIMALS = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const SHORTHAND_TWO_DECIMALS_NO_TRAILING_ZEROS = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
})

const SHORTHAND_ONE_DECIMAL = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const SHORTHAND_USD_TWO_DECIMALS = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  currency: 'USD',
  style: 'currency',
})

const SHORTHAND_USD_ONE_DECIMAL = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  currency: 'USD',
  style: 'currency',
})

const SIX_SIG_FIGS_TWO_DECIMALS = new Intl.NumberFormat('en-US', {
  notation: 'standard',
  maximumSignificantDigits: 6,
  minimumSignificantDigits: 3,
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
})

const SIX_SIG_FIGS_NO_COMMAS = new Intl.NumberFormat('en-US', {
  notation: 'standard',
  maximumSignificantDigits: 6,
  useGrouping: false,
})

const SIX_SIG_FIGS_TWO_DECIMALS_NO_COMMAS = new Intl.NumberFormat('en-US', {
  notation: 'standard',
  maximumSignificantDigits: 6,
  minimumSignificantDigits: 3,
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  useGrouping: false,
})

const THREE_SIG_FIGS_USD = new Intl.NumberFormat('en-US', {
  notation: 'standard',
  minimumSignificantDigits: 3,
  maximumSignificantDigits: 3,
  currency: 'USD',
  style: 'currency',
})

const SEVEN_SIG_FIGS__SCI_NOTATION_USD = new Intl.NumberFormat('en-US', {
  notation: 'scientific',
  minimumSignificantDigits: 7,
  maximumSignificantDigits: 7,
  currency: 'USD',
  style: 'currency',
})

type Format = Intl.NumberFormat | string

// each rule must contain either an `upperBound` or an `exact` value.
// upperBound => number will use that formatter as long as it is < upperBound
// exact => number will use that formatter if it is === exact
type FormatterRule =
  | { upperBound?: undefined; exact: number; formatter: Format }
  | { upperBound: number; exact?: undefined; formatter: Format }

// these formatter objects dictate which formatter rule to use based on the interval that
// the number falls into. for example, based on the rule set below, if your number
// falls between 1 and 1e6, you'd use TWO_DECIMALS as the formatter.
const tokenNonTxFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.001, formatter: '<0.001' },
  { upperBound: 1, formatter: THREE_DECIMALS },
  { upperBound: 1e6, formatter: TWO_DECIMALS },
  { upperBound: 1e15, formatter: SHORTHAND_TWO_DECIMALS },
  { upperBound: Infinity, formatter: '>999T' },
]

const tokenTxFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.00001, formatter: '<0.00001' },
  { upperBound: 1, formatter: FIVE_DECIMALS_MAX_TWO_DECIMALS_MIN },
  { upperBound: 10000, formatter: SIX_SIG_FIGS_TWO_DECIMALS },
  { upperBound: Infinity, formatter: TWO_DECIMALS },
]

const swapTradeAmountFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.1, formatter: SIX_SIG_FIGS_NO_COMMAS },
  { upperBound: 1, formatter: FIVE_DECIMALS_MAX_TWO_DECIMALS_MIN_NO_COMMAS },
  { upperBound: Infinity, formatter: SIX_SIG_FIGS_TWO_DECIMALS_NO_COMMAS },
]

const swapPriceFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.00001, formatter: '<0.00001' },
  ...swapTradeAmountFormatter,
]

const fiatTokenDetailsFormatter: FormatterRule[] = [
  { exact: 0, formatter: '$0.00' },
  { upperBound: 0.00000001, formatter: '<$0.00000001' },
  { upperBound: 0.1, formatter: THREE_SIG_FIGS_USD },
  { upperBound: 1.05, formatter: THREE_DECIMALS_USD },
  { upperBound: 1e6, formatter: TWO_DECIMALS_USD },
  { upperBound: Infinity, formatter: SHORTHAND_USD_TWO_DECIMALS },
]

const fiatTokenPricesFormatter: FormatterRule[] = [
  { exact: 0, formatter: '$0.00' },
  { upperBound: 0.00000001, formatter: '<$0.00000001' },
  { upperBound: 1, formatter: THREE_SIG_FIGS_USD },
  { upperBound: 1e6, formatter: TWO_DECIMALS_USD },
  { upperBound: 1e16, formatter: SHORTHAND_USD_TWO_DECIMALS },
  { upperBound: Infinity, formatter: SEVEN_SIG_FIGS__SCI_NOTATION_USD },
]

const fiatTokenStatsFormatter: FormatterRule[] = [
  // if token stat value is 0, we probably don't have the data for it, so show '-' as a placeholder
  { exact: 0, formatter: '-' },
  { upperBound: 0.01, formatter: '<$0.01' },
  { upperBound: 1000, formatter: TWO_DECIMALS_USD },
  { upperBound: Infinity, formatter: SHORTHAND_USD_ONE_DECIMAL },
]

const fiatGasPriceFormatter: FormatterRule[] = [
  { exact: 0, formatter: '$0.00' },
  { upperBound: 0.01, formatter: '<$0.01' },
  { upperBound: 1e6, formatter: TWO_DECIMALS_USD },
  { upperBound: Infinity, formatter: SHORTHAND_USD_TWO_DECIMALS },
]

const fiatTokenQuantityFormatter = [{ exact: 0, formatter: '$0.00' }, ...fiatGasPriceFormatter]

const portfolioBalanceFormatter: FormatterRule[] = [
  { exact: 0, formatter: '$0.00' },
  { upperBound: Infinity, formatter: TWO_DECIMALS_USD },
]

const ntfTokenFloorPriceFormatterTrailingZeros: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.001, formatter: '<0.001' },
  { upperBound: 1, formatter: THREE_DECIMALS },
  { upperBound: 1000, formatter: TWO_DECIMALS },
  { upperBound: 1e15, formatter: SHORTHAND_TWO_DECIMALS },
  { upperBound: Infinity, formatter: '>999T' },
]

const ntfTokenFloorPriceFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.001, formatter: '<0.001' },
  { upperBound: 1, formatter: THREE_DECIMALS_NO_TRAILING_ZEROS },
  { upperBound: 1000, formatter: TWO_DECIMALS_NO_TRAILING_ZEROS },
  { upperBound: 1e15, formatter: SHORTHAND_TWO_DECIMALS_NO_TRAILING_ZEROS },
  { upperBound: Infinity, formatter: '>999T' },
]

const ntfCollectionStatsFormatter: FormatterRule[] = [
  { upperBound: 1000, formatter: NO_DECIMALS },
  { upperBound: Infinity, formatter: SHORTHAND_ONE_DECIMAL },
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

export function formatNumber(
  input: Nullish<number>,
  type: NumberType = NumberType.TokenNonTx,
  placeholder = '-'
): string {
  if (input === null || input === undefined) {
    return placeholder
  }

  const formatter = getFormatterRule(input, type)
  if (typeof formatter === 'string') return formatter
  return formatter.format(input)
}

export function formatCurrencyAmount(
  amount: Nullish<CurrencyAmount<Currency>>,
  type: NumberType = NumberType.TokenNonTx,
  placeholder?: string
): string {
  return formatNumber(amount ? parseFloat(amount.toSignificant()) : undefined, type, placeholder)
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

  return formatNumber(parseFloat(price.toSignificant()), type)
}

export function formatNumberOrString(price: Nullish<number | string>, type: NumberType): string {
  if (price === null || price === undefined) return '-'
  if (typeof price === 'string') return formatNumber(parseFloat(price), type)
  return formatNumber(price, type)
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
