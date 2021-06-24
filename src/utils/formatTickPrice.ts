import { Bound } from '../state/mint/v3/actions'
import { Price, Token } from '@uniswap/sdk-core'
import { formatPrice } from './formatCurrencyAmount'

export function formatTickPrice(
  price: Price<Token, Token> | undefined,
  atLimit: { [bound in Bound]?: boolean | undefined },
  direction: Bound
) {
  return atLimit[direction] ? (direction === Bound.LOWER ? '0' : '∞') : formatPrice(price, 5)
}
