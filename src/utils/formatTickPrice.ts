import { Price, Token } from '@uniswap/sdk-core'

import { Bound } from '../state/mint/v3/actions'
import { formatPrice } from './formatCurrencyAmount'

export function formatTickPrice(
  price: Price<Token, Token> | undefined,
  atLimit: { [bound in Bound]?: boolean | undefined },
  direction: Bound,
  placeholder?: string
) {
  if (atLimit[direction]) {
    return direction === Bound.LOWER ? '0' : '∞'
  }

  if (!price && placeholder !== undefined) {
    return placeholder
  }

  return formatPrice(price, 5)
}
