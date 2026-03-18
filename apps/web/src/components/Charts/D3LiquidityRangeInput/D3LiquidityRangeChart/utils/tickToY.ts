import type { LinearTickScale } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'

type TickAlignment = 'center' | 'top' | 'bottom'

/**
 * Convert a tick to Y position using the linear tick scale.
 *
 * With a linear scale, ticks map directly to Y positions.
 * The tickAlignment parameter is kept for API compatibility but doesn't affect
 * the position since there are no discrete bands anymore.
 */
export const tickToY = ({
  tick,
  tickScale,
  tickAlignment: _tickAlignment,
}: {
  tick: number
  tickScale: LinearTickScale
  tickAlignment?: TickAlignment
}): number => {
  return tickScale.tickToY(tick)
}
