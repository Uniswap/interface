import { Percent } from '@uniswap/sdk-core'

export function formatPriceImpact(priceImpact: Percent | undefined): string {
  if (!priceImpact) {
    return '-'
  }

  return `${priceImpact.multiply(-1).toFixed(3)}%`
}
