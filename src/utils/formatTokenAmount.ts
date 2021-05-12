import { Price, CurrencyAmount, Currency } from '@uniswap/sdk-core'
import JSBI from 'jsbi'

export function formatTokenAmount(amount: CurrencyAmount<Currency> | undefined, sigFigs: number) {
  if (!amount) {
    return '-'
  }

  if (JSBI.equal(amount.quotient, JSBI.BigInt(0))) {
    return '0'
  }

  if (parseFloat(amount.toSignificant(Math.min(sigFigs, amount.currency.decimals))) < 0.000001) {
    return '<0.000001'
  }

  return amount.toSignificant(Math.min(sigFigs, amount.currency.decimals))
}

export function formatPrice(price: Price<Currency, Currency> | undefined, sigFigs: number) {
  if (!price) {
    return '-'
  }

  if (parseFloat(price.toFixed(sigFigs)) < 0.0001) {
    return '<0.0001'
  }

  return price.toSignificant(sigFigs)
}
