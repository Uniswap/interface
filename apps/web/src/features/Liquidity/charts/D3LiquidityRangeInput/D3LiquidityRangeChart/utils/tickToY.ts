import type { LinearTickScale } from '~/features/Liquidity/charts/D3LiquidityChartShared/types'
import type { BucketChartEntry } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/liquidityBucketing/liquidityBucketing'

type TickAlignment = 'center' | 'top' | 'bottom'

/**
 * Convert a tick to Y position using the linear tick scale.
 *
 * `tickAlignment` interprets the tick as the lower edge of a conceptual band of
 * width `tickSpacing` (mirroring v3 tick semantics):
 *   - 'bottom' → Y at the bottom of the band (= Y(tick))
 *   - 'top'    → Y at the top of the band (= Y(tick + tickSpacing))
 *   - 'center' → Y at the center of the band
 *   - undefined → raw Y(tick), no alignment offset
 */
export const tickToY = ({
  tick,
  tickScale,
  tickSpacing,
  tickAlignment,
}: {
  tick: number
  tickScale: LinearTickScale
  tickSpacing: number
  tickAlignment?: TickAlignment
}): number => {
  if (tickAlignment === 'top') {
    return tickScale.tickToAxis(tick + tickSpacing)
  }
  if (tickAlignment === 'center') {
    return tickScale.tickToAxis(tick + tickSpacing / 2)
  }
  return tickScale.tickToAxis(tick)
}

/**
 * Compute the Y position of the current tick dot.
 *
 * If the current tick falls within a rendered bucket, centers the dot
 * vertically within that bucket. Otherwise falls back to the raw tick position.
 * This ensures all renderers split colors at the same pixel position as the dot.
 */
export const getCurrentTickDotY = ({
  currentTick,
  renderedBuckets,
  tickScale,
}: {
  currentTick: number
  renderedBuckets: BucketChartEntry[] | undefined
  tickScale: LinearTickScale
}): number => {
  const currentBucket = renderedBuckets?.find((b) => currentTick >= b.startTick && currentTick < b.endTick)
  return currentBucket
    ? (tickScale.tickToAxis(currentBucket.startTick) + tickScale.tickToAxis(currentBucket.endTick)) / 2
    : tickScale.tickToAxis(currentTick)
}
