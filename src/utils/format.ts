import { Currency, CurrencyAmount, Fraction, Price } from '@uniswap/sdk-core'
import JSBI from 'jsbi'

export function formatCurrencyAmount(
  amount?: CurrencyAmount<Currency> | null,
  compact: boolean = true,
  sigFigs: number = 4,
  minDisplayAmount: Fraction = new Fraction(1, 100000)
) {
  if (!amount) {
    return '-'
  }

  if (JSBI.equal(amount.quotient, JSBI.BigInt(0))) {
    return '0'
  }

  if (amount.divide(amount.decimalScale).lessThan(minDisplayAmount)) {
    return '<0.00001'
  }

  const formatter = new Intl.NumberFormat('en-US', {
    notation: compact ? 'compact' : 'decimal',
    maximumFractionDigits: sigFigs,
  })

  return formatter.format(parseFloat(amount.toSignificant()))
}

export function formatPrice(
  price?: Price<Currency, Currency> | string | null,
  fractionDigits: number = 2
) {
  if (!price) {
    return '-'
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    notation: 'compact',
    currency: 'USD',
    maximumFractionDigits: fractionDigits,
  })

  if (typeof price === 'string') {
    return formatter.format(parseFloat(price))
  }

  return formatter.format(parseFloat(price.toSignificant()))
}
