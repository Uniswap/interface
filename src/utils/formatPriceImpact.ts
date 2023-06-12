import { Percent } from '@uniswap/sdk-core'

export function formatPriceImpact(priceImpact: Percent) {
  return `${priceImpact.multiply(-1).toFixed(2)}%`
}
