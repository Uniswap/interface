import { Currency, CurrencyAmount, Fraction, Price } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

import { MouseoverTooltip } from 'components/Tooltip'

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

export function toSignificantOrMaxIntegerPart(price: Price<Currency, Currency> | undefined, sigFigs: number): string {
  if (!price) return ''

  const n = price.toSignificant(18).split('.')[0].length
  if (n > sigFigs) return price.toSignificant(n)

  return price.toSignificant(sigFigs)
}

export function formatPrice(price: Price<Currency, Currency> | undefined, sigFigs: number) {
  if (!price) {
    return '-'
  }

  if (parseFloat(price.toFixed(sigFigs)) < 0.0001) {
    return '<0.0001'
  }

  if (parseFloat(price.toFixed(sigFigs)) > 10 ** sigFigs - 1) {
    return (
      <MouseoverTooltip text={toSignificantOrMaxIntegerPart(price, sigFigs)} placement="top" width="fit-content">
        {price.toSignificant(sigFigs).slice(0, sigFigs) + '...'}
      </MouseoverTooltip>
    )
  }
  return price.toSignificant(sigFigs)
}
