import type { Percent } from '@uniswap/sdk-core'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'

export function formatPriceDifference(
  priceDifference: Percent,
  formatPercent: LocalizationContextState['formatPercent'],
): string | undefined {
  const absDifference = priceDifference.lessThan(0) ? priceDifference.multiply(-1) : priceDifference
  return formatPercent(absDifference.toFixed(3))
}
