/* Copied from Uniswap/v-3: https://github.com/Uniswap/v3-info/blob/master/src/utils/numbers.ts */
import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { DEFAULT_LOCALE } from 'constants/locales'
import numbro from 'numbro'

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

interface FormatDollarArgs {
  num: number | undefined | null
  isPrice?: boolean
  lessPreciseStablecoinValues?: boolean
  digits?: number
  round?: boolean
}

/**
 * Returns a USD dollar or equivalent denominated numerical value formatted
 * in human readable string for use in template.
 *
 * Adheres to guidelines for prices and other numbers defined here:
 * https://www.notion.so/uniswaplabs/Number-standards-fbb9f533f10e4e22820722c2f66d23c0
 * @param num numerical value denominated in USD or USD equivalent
 * @param isPrice whether the amount represents a price or not
 * @param lessPreciseStablecoinValues whether or not we should show less precise values for
 * stablecoins (around 1$ in value always) for the sake of readability
 * @param digits number of digits after the decimal for non-price amounts
 * @param round whether or not to round up non-price amounts
 */
export const formatDollar = ({
  num,
  isPrice = false,
  lessPreciseStablecoinValues = false,
  digits = 2,
  round = true,
}: FormatDollarArgs): string => {
  // For USD dollar denominated prices.
  if (isPrice) {
    if (num === 0) return '$0.00'
    if (!num) return '-'
    if (num < 0.000001) {
      return `$${num.toExponential(2)}`
    }
    if ((num >= 0.000001 && num < 0.1) || num > 1000000) {
      return `$${Number(num).toPrecision(3)}`
    }
    // We only show 2 decimal places in explore table for stablecoin value ranges
    // for the sake of readability (as opposed to the usual 3 elsewhere).
    if (num >= 0.1 && num < (lessPreciseStablecoinValues ? 0.9995 : 1.05)) {
      return `$${num.toFixed(3)}`
    }
    return `$${Number(num.toFixed(2)).toLocaleString(DEFAULT_LOCALE, { minimumFractionDigits: 2 })}`
  }
  // For volume dollar amounts, like market cap, total value locked, etc.
  else {
    if (num === 0) return '0'
    if (!num) return '-'
    if (num < 0.000001) {
      return '$<0.000001'
    }
    if (num >= 0.000001 && num < 0.1) {
      return `$${Number(num).toPrecision(3)}`
    }
    if (num >= 0.1 && num < 1.05) {
      return `$${num.toFixed(3)}`
    }

    return numbro(num)
      .formatCurrency({
        average: round,
        mantissa: num > 1000 ? 2 : digits,
        abbreviations: {
          million: 'M',
          billion: 'B',
        },
      })
      .toUpperCase()
  }
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

// using a currency library here in case we want to add more in future
export const formatAmount = (num: number | undefined, digits = 2) => {
  if (num === 0) return '0'
  if (!num) return '-'
  if (num < 0.001) {
    return '$<0.001'
  }
  return numbro(num).format({
    average: true,
    mantissa: num > 1000 ? 2 : digits,
    abbreviations: {
      million: 'M',
      billion: 'B',
    },
  })
}
