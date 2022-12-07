import { formatPrice, NumberType } from '@uniswap/conedison/format'
import { Price, Token } from '@uniswap/sdk-core'

import { Bound } from '../state/mint/v3/actions'

interface FormatTickPriceArgs {
  price: Price<Token, Token> | undefined
  atLimit: { [bound in Bound]?: boolean | undefined }
  direction: Bound
  numberType: NumberType
  placeholder?: string
}

export function formatTickPrice({ price, atLimit, direction, numberType, placeholder }: FormatTickPriceArgs) {
  if (atLimit[direction]) {
    return direction === Bound.LOWER ? '0' : '∞'
  }

  if (!price && placeholder !== undefined) {
    return placeholder
  }

  return formatPrice(price, numberType)
}
