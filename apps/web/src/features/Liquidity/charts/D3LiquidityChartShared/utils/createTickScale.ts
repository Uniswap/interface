import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import * as d3 from 'd3'
import type { LinearTickScale } from '~/features/Liquidity/charts/D3LiquidityChartShared/types'

const EMPTY_SCALE: LinearTickScale = {
  tickToAxis: () => 0,
  axisToTick: () => 0,
  minTick: 0,
  maxTick: 0,
  range: [0, 0],
}

/**
 * Creates a linear tick scale mapping the full tick range to pixel positions.
 *
 * @param invert - When true, high ticks map to low pixel values (vertical charts: high tick = top of screen). When false, low ticks map to low pixel values (horizontal charts: low tick = left of screen).
 */
export function createTickScale({
  tickSpacing,
  size,
  zoomLevel,
  pan,
  invert = false,
}: {
  tickSpacing: number
  size: number
  zoomLevel: number
  pan: number
  /** When true, high ticks map to low pixel values (vertical: high tick at top). When false, low ticks on left (horizontal). */
  invert?: boolean
}): LinearTickScale {
  if (size === 0) {
    return EMPTY_SCALE
  }

  const fullMinTick = nearestUsableTick(TickMath.MIN_TICK, tickSpacing)
  const fullMaxTick = nearestUsableTick(TickMath.MAX_TICK, tickSpacing)

  const scaled = size * zoomLevel
  const rangeStart = pan
  const rangeEnd = scaled + pan

  const domain = invert ? [fullMaxTick, fullMinTick] : [fullMinTick, fullMaxTick]
  const d3Scale = d3.scaleLinear().domain(domain).range([rangeStart, rangeEnd])

  return {
    tickToAxis: (tick: number) => d3Scale(tick),
    axisToTick: (pos: number) => d3Scale.invert(pos),
    minTick: fullMinTick,
    maxTick: fullMaxTick,
    range: [rangeStart, rangeEnd],
  }
}
