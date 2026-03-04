import type { LinearTickScale } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { ChartEntry } from '~/components/Charts/LiquidityRangeInput/types'

export type TickAlignment = 'center' | 'top' | 'bottom'

/**
 * Convert a price to Y position.
 *
 * Finds the closest tick in liquidityData for the given price,
 * then converts that tick to Y using the linear scale.
 */
export function priceToY({
  price,
  liquidityData,
  tickScale,
  tickAlignment: _tickAlignment,
}: {
  price: number
  liquidityData: ChartEntry[]
  tickScale: LinearTickScale
  tickAlignment?: TickAlignment
}): number {
  if (liquidityData.length === 0) {
    return 0
  }

  // Find the entry with the closest price
  const closest = liquidityData.reduce((prev, curr) =>
    Math.abs(curr.price0 - price) < Math.abs(prev.price0 - price) ? curr : prev,
  )

  return tickScale.tickToY(closest.tick)
}
