import { numericInputEnforcerWithInfinity } from 'uniswap/src/components/AmountInput/utils/numericInputEnforcer'
import { convertScientificNotationToNumber } from 'utilities/src/format/convertScientificNotation'
import {
  getUsableTickBounds,
  snapTickToSpacing,
} from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'
import type { PriceRangeState, TickRange } from '~/features/Liquidity/Create/types'
import { clampMaxTick, clampMinTick } from '~/features/Liquidity/utils/clampTickRange'

/**
 * Whether the range state holds a range: full range, or both edges. Until then the flow's ticks fall back
 * to the extremes, which would read as an enormous range.
 */
export function isPriceRangeSet({
  fullRange,
  minTick,
  maxTick,
}: Pick<PriceRangeState, 'fullRange' | 'minTick' | 'maxTick'>): boolean {
  return fullRange || (minTick !== undefined && maxTick !== undefined)
}

// The domain shows this many times the range's reach either side of the current price, so the edges
// sit well inside it with room to drag outwards.
const DOMAIN_REACH_MULTIPLIER = 2
const MIN_DOMAIN_HALF_WIDTH_IN_SPACINGS = 30

/** The tick span that fits a range, centered on the current tick. */
export function getEditorDomain({
  range,
  currentTick,
  tickSpacing,
}: {
  range?: TickRange
  currentTick: number
  tickSpacing: number
}): TickRange {
  // An edge at the usable bound is unbounded (a full or one-sided range); sizing to it would shrink
  // everything else to nothing, so only bounded edges count.
  const bounds = getUsableTickBounds(tickSpacing)
  const boundedEdges = range
    ? [
        range.minTick > bounds.minTick ? range.minTick : undefined,
        range.maxTick < bounds.maxTick ? range.maxTick : undefined,
      ]
    : []
  const reach = Math.max(0, ...boundedEdges.map((edge) => (edge === undefined ? 0 : Math.abs(edge - currentTick))))
  const halfWidth = Math.max(reach * DOMAIN_REACH_MULTIPLIER, MIN_DOMAIN_HALF_WIDTH_IN_SPACINGS * tickSpacing)
  return {
    minTick: Math.max(bounds.minTick, currentTick - halfWidth),
    maxTick: Math.min(bounds.maxTick, currentTick + halfWidth),
  }
}

/**
 * The usable display tick for a price `percent` away from the current tick's (-10 = 10% below), snapped to
 * the spacing. A move to or below -100% is a price of zero, the lowest usable tick.
 */
export function percentToDisplayTick({
  percent,
  currentTick,
  tickSpacing,
}: {
  percent: number
  currentTick: number
  tickSpacing: number
}): number {
  const ratio = 1 + percent / 100
  if (ratio <= 0) {
    return getUsableTickBounds(tickSpacing).minTick
  }
  return snapTickToSpacing(currentTick + Math.log(ratio) / Math.log(1.0001), tickSpacing)
}

/**
 * The range with one edge set to a typed tick: snapped, clamped to the usable ticks, and stopped a spacing
 * short of the other edge rather than crossing it.
 */
export function setRangeEdge({
  range,
  edge,
  tick,
  tickSpacing,
}: {
  range: TickRange
  edge: 'min' | 'max'
  tick: number
  tickSpacing: number
}): TickRange {
  const snapped = snapTickToSpacing(tick, tickSpacing)
  return edge === 'min'
    ? { ...range, minTick: clampMinTick({ tick: snapped, maxTick: range.maxTick, tickSpacing }) ?? snapped }
    : { ...range, maxTick: clampMaxTick({ tick: snapped, minTick: range.minTick, tickSpacing }) ?? snapped }
}

/** How far a +/- press moves an edge, in percentage points of its move from the current price. */
export const EDGE_STEP_PERCENT = 0.5

/**
 * The next multiple of `step` strictly beyond `percent` in `direction`: a value off the grid snaps to its
 * neighbouring multiple that way (-6.3 goes to -6 up and -6.5 down), and one on it moves a whole step.
 */
export function nextPercentStep({
  percent,
  direction,
  step = EDGE_STEP_PERCENT,
}: {
  percent: number
  direction: 1 | -1
  step?: number
}): number {
  const index = percent / step
  return (direction === 1 ? Math.floor(index) + 1 : Math.ceil(index) - 1) * step
}

/**
 * One edge moved to the next `EDGE_STEP_PERCENT` multiple of its move from the current price, as the editor's
 * +/- buttons do; undefined when it can't move, at a usable tick or a spacing from the other edge.
 */
export function stepRangeEdgeByPercent({
  range,
  edge,
  direction,
  currentTick,
  tickSpacing,
}: {
  range: TickRange
  edge: 'min' | 'max'
  direction: 1 | -1
  currentTick: number
  tickSpacing: number
}): TickRange | undefined {
  const edgeTick = edge === 'min' ? range.minTick : range.maxTick
  // Stepping from halfway to the next spacing rather than from the edge itself: an edge an earlier step
  // left a hair short of its multiple (the tick snaps) would otherwise step onto that multiple again and
  // stay put, and a spacing wider than a step skips the multiples that round back onto the same tick.
  const threshold = (1.0001 ** (edgeTick + (direction * tickSpacing) / 2 - currentTick) - 1) * 100
  const percent = nextPercentStep({ percent: threshold, direction })
  const tick = percentToDisplayTick({ percent, currentTick, tickSpacing })
  const isUnmoved = (next: TickRange) => next.minTick === range.minTick && next.maxTick === range.maxTick
  const stepped = setRangeEdge({ range, edge, tick, tickSpacing })
  if (!isUnmoved(stepped)) {
    return stepped
  }
  // Far from the price a half percent is less than a tick, and at ∞ the percent is too large for the float
  // to step at all, so the edge moves by a spacing instead.
  const nudged = setRangeEdge({ range, edge, tick: edgeTick + direction * tickSpacing, tickSpacing })
  return isUnmoved(nudged) ? undefined : nudged
}

/** The create flow's numeric-or-∞ input check, plus a leading sign for a percent below the price. */
export function isRangeEdgeInputValid(value?: string): boolean {
  return numericInputEnforcerWithInfinity(value?.replace(/^[-+]/, ''))
}

/** A percent as plain digits an input can take back: an edge far above the price moves by e+40 percent. */
export function formatEditablePercent(percent: number): string {
  return convertScientificNotationToNumber(String(percent))
}

/** A price as plain digits an input can take back: six significant figures, never exponent notation. */
export function formatEditablePrice(price: number): string {
  if (!Number.isFinite(price) || price <= 0) {
    return '0'
  }
  return convertScientificNotationToNumber(String(Number(price.toPrecision(6))))
}
