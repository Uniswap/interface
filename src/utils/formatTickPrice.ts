import { Currency, Price } from '@kyberswap/ks-sdk-core'

import { Bound } from 'state/mint/proamm/type'

import { formatPrice } from './formatCurrencyAmount'

export function formatTickPrice(
  price: Price<Currency, Currency> | undefined,
  atLimit?: { [bound in Bound]?: boolean | undefined },
  direction?: Bound,
  placeholder?: string,
) {
  if (direction && atLimit?.[direction]) {
    return direction === Bound.LOWER ? '0' : '∞'
  }

  if (!price && placeholder !== undefined) {
    return placeholder
  }
  return formatPrice(price, 6)
}
