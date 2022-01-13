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

const baseFormatOptions: Intl.NumberFormatOptions = {
  style: 'currency',
  notation: 'compact',
  currency: 'USD',
  maximumFractionDigits: 2,
}

export function formatPrice(
  price?: Price<Currency, Currency> | string | null | number,
  options: Intl.NumberFormatOptions = {}
) {
  if (!price) {
    return '-'
  }

  const formatter = new Intl.NumberFormat('en-US', { ...baseFormatOptions, ...options })

  if (typeof price === 'string') {
    return formatter.format(parseFloat(price))
  }

  if (typeof price === 'number') {
    return formatter.format(price)
  }

  return formatter.format(parseFloat(price.toSignificant()))
}

/**
 * Very simple date formatter
 * Feel free to add more options / adapt to your needs.
 */
export function formatDate(date: Date) {
  return date.toLocaleString('en-US', {
    day: 'numeric', // numeric, 2-digit
    year: 'numeric', // numeric, 2-digit
    month: 'short', // numeric, 2-digit, long, short, narrow
    hour: 'numeric', // numeric, 2-digit
    minute: 'numeric', // numeric, 2-digit
  })
}

export function formatUSDPrice(price?: number | string) {
  const options: Intl.NumberFormatOptions = { notation: 'standard' }
  return formatPrice(price, options)
}
