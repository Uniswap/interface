/* Copied from Uniswap/v-3: https://github.com/Uniswap/v3-info/blob/master/src/utils/numbers.ts */
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import numbro from 'numbro'

// Convert [CurrencyAmount] to number with necessary precision for price formatting.
export const currencyAmountToPreciseFloat = (currencyAmount: CurrencyAmount<Currency>) => {
  const floatForLargerNumbers = parseFloat(currencyAmount.toFixed(3))
  if (floatForLargerNumbers < 0.1) {
    return parseFloat(currencyAmount.toSignificant(3))
  }
  return floatForLargerNumbers
}

// Using a currency library here in case we want to add more in future.
export const formatDollar = (num: number | undefined | null, isPrice = false, digits = 2, round = true) => {
  if (isPrice) {
    if (num === 0) return '$0.00'
    if (!num) return '-'
    if (num < 0.000001) {
      return `$${num.toExponential(2)}`
    }
    if (num >= 0.000001 && num < 0.1) {
      return `$${Number(num).toPrecision(3)}`
    }
    if (num >= 0.1 && num < 1.05) {
      return `$${num.toFixed(3)}`
    }
    // if number is greater than 1.05:
    return `$${num.toFixed(2)}`
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
