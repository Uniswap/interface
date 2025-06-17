import type { Percent } from '@uniswap/sdk-core'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'

export function formatPriceImpact(
  priceImpact: Percent,
  formatPercent: LocalizationContextState['formatPercent'],
): string | undefined {
  const positiveImpactPrefix = priceImpact.lessThan(0) ? '+' : ''
  return `${positiveImpactPrefix}${formatPercent(priceImpact.multiply(-1).toFixed(3))}`
}
