import type { Percent } from '@uniswap/sdk-core'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'

export function formatPriceImpact(
  priceImpact: Percent,
  formatPercent: LocalizationContextState['formatPercent'],
): string | undefined {
  const absImpact = priceImpact.lessThan(0) ? priceImpact.multiply(-1) : priceImpact
  return formatPercent(absImpact.toFixed(3))
}
