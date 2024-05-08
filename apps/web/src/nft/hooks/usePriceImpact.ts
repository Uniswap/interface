import { useMemo } from 'react'
import { ClassicTrade } from 'state/routing/types'
import { useTheme } from 'styled-components'
import { useFormatter } from 'utils/formatNumbers'
import { computeRealizedPriceImpact, getPriceImpactWarning } from 'utils/prices'

export interface PriceImpact {
  priceImpactSeverity: PriceImpactSeverity
  displayPercentage(): string
}

interface PriceImpactSeverity {
  type: 'warning' | 'error'
  color: string
}

export function usePriceImpact(trade?: ClassicTrade): PriceImpact | undefined {
  const theme = useTheme()
  const { formatPercent } = useFormatter()

  return useMemo(() => {
    const marketPriceImpact = trade ? computeRealizedPriceImpact(trade) : undefined
    const priceImpactWarning = marketPriceImpact ? getPriceImpactWarning(marketPriceImpact) : undefined
    const warningColor =
      priceImpactWarning === 'error'
        ? theme.critical
        : priceImpactWarning === 'warning'
        ? theme.deprecated_accentWarning
        : undefined

    return marketPriceImpact && priceImpactWarning && warningColor
      ? {
          priceImpactSeverity: {
            type: priceImpactWarning,
            color: warningColor,
          },
          displayPercentage: () => formatPercent(marketPriceImpact),
        }
      : undefined
  }, [formatPercent, theme.critical, theme.deprecated_accentWarning, trade])
}
