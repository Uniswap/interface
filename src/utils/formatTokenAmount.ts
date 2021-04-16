import { Price, TokenAmount } from '@uniswap/sdk-core'

export function formatTokenAmount(amount: TokenAmount | undefined, sigFigs: number) {
  if (!amount) {
    return '-'
  }

  if (parseFloat(amount.toFixed(sigFigs)) < 0.0001) {
    return '<0.0001'
  }

  return amount.toSignificant(sigFigs)
}

export function formatPrice(price: Price | undefined, sigFigs: number) {
  if (!price) {
    return '-'
  }

  if (parseFloat(price.toFixed(sigFigs)) < 0.0001) {
    return '<0.0001'
  }

  return price.toSignificant(sigFigs)
}
