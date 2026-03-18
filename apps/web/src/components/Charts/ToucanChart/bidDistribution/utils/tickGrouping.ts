import type { ChartBarData } from '~/components/Toucan/Auction/BidDistributionChart/utils/utils'
import {
  calculateInitialVisibleRange,
  getPaddedConcentrationRange,
} from '~/components/Toucan/Auction/BidDistributionChart/utils/utils'
import { BID_DISTRIBUTION_INITIAL_ZOOM } from '~/components/Toucan/Auction/BidDistributionChart/zoomConfig'

// =============================================================================
// TICK GROUPING CONFIGURATION
//
// These values control how ticks are grouped in the bid distribution chart.
// Grouping reduces visual clutter when there are many ticks.
// =============================================================================

// Target number of bars to display after grouping.
// The grouping factor is calculated as: ceil(initialTickCount / TARGET_GROUPED_BARS)
//
// Examples:
// - TARGET_GROUPED_BARS = 33 (default): ~33 bars after grouping
//   - 100 ticks → 4x grouping (25 bars)
//   - 200 ticks → 7x grouping (29 bars)
//   - 330 ticks → 10x grouping (33 bars)
//
// - TARGET_GROUPED_BARS = 50: More bars, less aggressive grouping
// - TARGET_GROUPED_BARS = 20: Fewer bars, more aggressive grouping
const TARGET_GROUPED_BARS = 33

// Minimum grouping factor required for the "Group Ticks" toggle to be shown.
// If grouping would result in a factor less than this, the toggle is hidden
// since grouping wouldn't provide meaningful visual simplification.
//
// The tick threshold is: TARGET_GROUPED_BARS * (MIN_MEANINGFUL_GROUP_SIZE - 1) + 1
//
// Examples with TARGET_GROUPED_BARS = 33:
// - MIN_MEANINGFUL_GROUP_SIZE = 2: Show toggle when >33 ticks (2+ ticks per bar)
// - MIN_MEANINGFUL_GROUP_SIZE = 3: Show toggle when >66 ticks (3+ ticks per bar) [default]
// - MIN_MEANINGFUL_GROUP_SIZE = 5: Show toggle when >132 ticks (5+ ticks per bar)
const MIN_MEANINGFUL_GROUP_SIZE = 3

// =============================================================================

export interface TickGroupingConfig {
  groupSizeTicks: number
  medianOffsetTicks: number
}

function clampInt(params: { value: number; min: number; max: number }): number {
  const { value, min, max } = params
  return Math.min(Math.max(value, min), max)
}

export function computeTickGroupingConfig(params: {
  bars: ChartBarData[]
  minTick: number
  maxTick: number
  tickSizeDecimal: number
  clearingPriceDecimal: number
  concentration: { startTick: number; endTick: number } | null
}): TickGroupingConfig {
  const { bars, minTick, maxTick, tickSizeDecimal, clearingPriceDecimal, concentration } = params

  if (bars.length === 0 || !Number.isFinite(tickSizeDecimal) || tickSizeDecimal <= 0) {
    return { groupSizeTicks: 1, medianOffsetTicks: 0 }
  }

  const initialRange = concentration
    ? getPaddedConcentrationRange({
        startTick: concentration.startTick,
        endTick: concentration.endTick,
        minTick,
        maxTick,
        tickSizeDecimal,
        beforePercentOfFullRange: BID_DISTRIBUTION_INITIAL_ZOOM.concentrationPadding.beforePercentOfFullRange,
        afterPercentOfFullRange: BID_DISTRIBUTION_INITIAL_ZOOM.concentrationPadding.afterPercentOfFullRange,
        minPadTicks: BID_DISTRIBUTION_INITIAL_ZOOM.concentrationPadding.minPadTicks,
      })
    : calculateInitialVisibleRange({
        clearingPrice: clearingPriceDecimal,
        minTick,
        maxTick,
        tickSize: tickSizeDecimal,
      })

  const fromIndex = clampInt({
    value: Math.floor((initialRange.from - minTick) / tickSizeDecimal),
    min: 0,
    max: bars.length - 1,
  })
  const toIndex = clampInt({
    value: Math.ceil((initialRange.to - minTick) / tickSizeDecimal),
    min: 0,
    max: bars.length - 1,
  })
  const initialTickCount = Math.max(1, toIndex - fromIndex + 1)

  const groupSizeTicks = Math.max(1, Math.ceil(initialTickCount / TARGET_GROUPED_BARS))
  const medianOffsetTicks = Math.floor((groupSizeTicks - 1) / 2)

  return { groupSizeTicks, medianOffsetTicks }
}

/**
 * Check if tick grouping would be meaningful for the given data.
 * Returns true if enabling grouping would combine at least MIN_MEANINGFUL_GROUP_SIZE
 * ticks per bar, providing noticeable visual simplification.
 */
export function isGroupingMeaningful(params: {
  bars: ChartBarData[]
  minTick: number
  maxTick: number
  tickSizeDecimal: number
  clearingPriceDecimal: number
  concentration: { startTick: number; endTick: number } | null
}): boolean {
  const config = computeTickGroupingConfig(params)
  return config.groupSizeTicks >= MIN_MEANINGFUL_GROUP_SIZE
}

export interface GroupedTickBar {
  tick: number
  tickQ96: string
  amount: number
}

export function groupTickBars(params: {
  bars: ChartBarData[]
  tickSizeDecimal: number
  minBidTickDecimal: number
  grouping: TickGroupingConfig
}): GroupedTickBar[] {
  const { bars, tickSizeDecimal, minBidTickDecimal, grouping } = params

  if (grouping.groupSizeTicks <= 1 || bars.length === 0) {
    return bars.map((b) => ({ tick: b.tick, tickQ96: b.tickQ96, amount: b.amount }))
  }

  if (!Number.isFinite(tickSizeDecimal) || tickSizeDecimal <= 0) {
    return bars.map((b) => ({ tick: b.tick, tickQ96: b.tickQ96, amount: b.amount }))
  }

  const minTick = bars[0].tick
  const minBidIndex = Math.round((minBidTickDecimal - minTick) / tickSizeDecimal)
  const groupStartIndex0 = minBidIndex - grouping.medianOffsetTicks
  const groups = new Map<number, ChartBarData[]>()

  for (const bar of bars) {
    const idx = bar.index
    const groupKey = Math.floor((idx - groupStartIndex0) / grouping.groupSizeTicks)
    const existing = groups.get(groupKey)
    if (existing) {
      existing.push(bar)
    } else {
      groups.set(groupKey, [bar])
    }
  }

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => a - b)
  const grouped: GroupedTickBar[] = []

  for (const key of sortedKeys) {
    const groupBars = groups.get(key)
    if (!groupBars || groupBars.length === 0) {
      continue
    }

    // The “intended” median index for this group in the original bar array.
    const intendedGroupStartIndex = groupStartIndex0 + key * grouping.groupSizeTicks
    const intendedMedianIndex = intendedGroupStartIndex + grouping.medianOffsetTicks

    // Clamp median selection to the actually-present bar indices (edge groups can be truncated).
    const actualStartIndex = groupBars[0]!.index
    const actualEndIndex = groupBars[groupBars.length - 1]!.index
    const clampedMedianIndex = clampInt({ value: intendedMedianIndex, min: actualStartIndex, max: actualEndIndex })
    const medianInGroup = groupBars[clampedMedianIndex - actualStartIndex] ?? groupBars[0]!

    const amount = groupBars.reduce((sum, b) => sum + b.amount, 0)
    grouped.push({ tick: medianInGroup.tick, tickQ96: medianInGroup.tickQ96, amount })
  }

  return grouped
}
