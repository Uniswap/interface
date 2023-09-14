import { Currency, CurrencyAmount, Percent, Price } from '@uniswap/sdk-core'

// Number formatting in our app should follow the guide in this doc:
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

const SHORTHAND_ONE_DECIMAL = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const SHORTHAND_TWO_DECIMALS = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
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

const NO_TRAILING_DECIMALS_PERCENTAGES = new Intl.NumberFormat('en-US', {
  notation: 'standard',
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const TWO_DECIMALS_PERCENTAGES = new Intl.NumberFormat('en-US', {
  notation: 'standard',
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
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
  { upperBound: 0.00000001, formatter: '<$0.00000001' },
  { upperBound: 0.1, formatter: THREE_SIG_FIGS_USD },
  { upperBound: 1.05, formatter: THREE_DECIMALS_USD },
  { upperBound: 1e6, formatter: TWO_DECIMALS_USD },
  { upperBound: Infinity, formatter: SHORTHAND_USD_TWO_DECIMALS },
]

const fiatTokenPricesFormatter: FormatterRule[] = [
  { upperBound: 0.00000001, formatter: '<$0.00000001' },
  { upperBound: 1, formatter: THREE_SIG_FIGS_USD },
  { upperBound: 1e6, formatter: TWO_DECIMALS_USD },
  { upperBound: Infinity, formatter: SHORTHAND_USD_TWO_DECIMALS },
]

const fiatTokenStatsFormatter: FormatterRule[] = [
  // if token stat value is 0, we probably don't have the data for it, so show '-' as a placeholder
  { exact: 0, formatter: '-' },
  { upperBound: 0.01, formatter: '<$0.01' },
  { upperBound: 1000, formatter: TWO_DECIMALS_USD },
  { upperBound: Infinity, formatter: SHORTHAND_USD_ONE_DECIMAL },
]

const fiatGasPriceFormatter: FormatterRule[] = [
  { upperBound: 0.01, formatter: '<$0.01' },
  { upperBound: 1e6, formatter: TWO_DECIMALS_USD },
  { upperBound: Infinity, formatter: SHORTHAND_USD_TWO_DECIMALS },
]

const fiatTokenQuantityFormatter = [{ exact: 0, formatter: '$0.00' }, ...fiatGasPriceFormatter]

const portfolioBalanceFormatter: FormatterRule[] = [
  { exact: 0, formatter: '$0.00' },
  { upperBound: Infinity, formatter: TWO_DECIMALS_USD },
]

const ntfTokenFloorPriceFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.001, formatter: '<0.001' },
  { upperBound: 1, formatter: THREE_DECIMALS },
  { upperBound: 1000, formatter: TWO_DECIMALS },
  { upperBound: 1e15, formatter: SHORTHAND_TWO_DECIMALS },
  { upperBound: Infinity, formatter: '>999T' },
]

const ntfCollectionStatsFormatter: FormatterRule[] = [
  { upperBound: 1000, formatter: NO_DECIMALS },
  { upperBound: Infinity, formatter: SHORTHAND_ONE_DECIMAL },
]

const percentagesFormatter: FormatterRule[] = [
  { upperBound: 0.01, formatter: TWO_DECIMALS_PERCENTAGES },
  { upperBound: Infinity, formatter: NO_TRAILING_DECIMALS_PERCENTAGES },
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

  Percentage = 'percentage',
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

export function formatNumber(
  input?: number | null,
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
  amount?: CurrencyAmount<Currency> | null,
  type: NumberType = NumberType.TokenNonTx,
  placeholder?: string
): string {
  return formatNumber(amount ? parseFloat(amount.toFixed()) : undefined, type, placeholder)
}

export function formatPriceImpact(priceImpact: Percent | undefined): string {
  if (!priceImpact) return '-'

  return `${priceImpact.multiply(-1).toFixed(3)}%`
}

export function formatPrice(
  price?: Price<Currency, Currency> | null,
  type: NumberType = NumberType.FiatTokenPrice
): string {
  if (price === null || price === undefined) {
    return '-'
  }

  return formatNumber(parseFloat(price.toSignificant()), type)
}

export function formatNumberOrString(price: Maybe<number | string>, type: NumberType): string {
  if (price === null || price === undefined) return '-'
  if (typeof price === 'string') return formatNumber(parseFloat(price), type)
  return formatNumber(price, type)
}

export function formatUSDPrice(
  price: Maybe<number | string>,
  type: NumberType = NumberType.FiatTokenPrice
): string {
  return formatNumberOrString(price, type)
}

/** Formats USD and non-USD prices */
export function formatFiatPrice(price: Maybe<number>, currency = 'USD'): string {
  if (price === null || price === undefined) return '-'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price)
}

export function formatPercent(rawPercentage: Maybe<number | string>): string {
  if (rawPercentage === null || rawPercentage === undefined) return '-'
  const percentage =
    typeof rawPercentage === 'string'
      ? parseFloat(rawPercentage)
      : parseFloat(rawPercentage.toString())
  return formatNumber(percentage / 100, NumberType.Percentage)
}
