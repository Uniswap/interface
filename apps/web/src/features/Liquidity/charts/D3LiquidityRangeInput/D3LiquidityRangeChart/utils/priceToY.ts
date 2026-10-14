import type { Currency } from '@uniswap/sdk-core'
import type { LinearTickScale } from '~/features/Liquidity/charts/D3LiquidityChartShared/types'
import { priceToTick } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/priceToTick'
import { ChartEntry } from '~/features/Liquidity/charts/LiquidityRangeInput/types'

export type TickAlignment = 'center' | 'top' | 'bottom'

/**
 * Convert a price to Y position.
 *
 * Snaps to the liquidity entry with the closest price when that entry is within one tick spacing of
 * the price's own tick, so the line sits on the distribution's ticks. Otherwise the price is placed
 * analytically: a pool being created has no liquidity data, and one whose only ticks are far away (an
 * emptied full-range position) would collapse every price onto the same entry.
 */
export function priceToY({
  price,
  liquidityData,
  tickScale,
  tickSpacing,
  baseCurrency,
  quoteCurrency,
  tickAlignment: _tickAlignment,
}: {
  price: number
  liquidityData: ChartEntry[]
  tickScale: LinearTickScale
  tickSpacing: number
  /** Visual base/quote (already swapped when priceInverted). */
  baseCurrency?: Maybe<Currency>
  quoteCurrency?: Maybe<Currency>
  tickAlignment?: TickAlignment
}): number {
  const tick = priceToTick({ price, baseCurrency, quoteCurrency })
  if (liquidityData.length === 0) {
    return tickScale.tickToAxis(tick)
  }

  // Find the entry with the closest price
  const closest = liquidityData.reduce((prev, curr) =>
    Math.abs(curr.price0 - price) < Math.abs(prev.price0 - price) ? curr : prev,
  )

  return tickScale.tickToAxis(Math.abs(closest.tick - tick) <= tickSpacing ? closest.tick : tick)
}
