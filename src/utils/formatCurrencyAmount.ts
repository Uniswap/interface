import { Currency, CurrencyAmount, Fraction, Price } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

export function formatCurrencyAmount(amount: CurrencyAmount<Currency> | undefined, sigFigs: number) {
  if (!amount) {
    return '-'
  }

  if (JSBI.equal(amount.quotient, JSBI.BigInt(0))) {
    return '0'
  }

  if (amount.divide(amount.decimalScale).lessThan(new Fraction(1, 100000))) {
    return '<0.00001'
  }

  return amount.toSignificant(sigFigs)
}

export function formatPrice(price: Price<Currency, Currency> | undefined, sigFigs: number) {
  if (!price) {
    return '-'
  }

  if (parseFloat(price.toFixed(sigFigs)) < 0.0001) {
    return '<0.0001'
  }

  if (parseFloat(price.toFixed(sigFigs)) > 10 ** sigFigs - 1) {
    return price.toSignificant(sigFigs).slice(0, sigFigs) + '...'
  }
  return price.toSignificant(sigFigs)
}
