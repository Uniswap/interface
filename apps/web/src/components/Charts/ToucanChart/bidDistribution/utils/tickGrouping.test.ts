import { describe, expect, test } from 'vitest'
import {
  computeTickGroupingConfig,
  groupTickBars,
} from '~/components/Charts/ToucanChart/bidDistribution/utils/tickGrouping'
import type { ChartBarData } from '~/components/Toucan/Auction/BidDistributionChart/utils/utils'

function makeBars(params: { count: number; tickSize: number }): ChartBarData[] {
  const { count, tickSize } = params
  return Array.from({ length: count }).map((_, index) => ({
    tick: index * tickSize,
    tickQ96: `${index}`,
    tickDisplay: `${index}`,
    amount: 1,
    index,
  }))
}

describe('tickGrouping', () => {
  test('computeTickGroupingConfig returns group size to target ~33 bars in the initial concentration zoom', () => {
    const bars = makeBars({ count: 300, tickSize: 1 })

    const grouping = computeTickGroupingConfig({
      bars,
      minTick: 0,
      maxTick: 299,
      tickSizeDecimal: 1,
      clearingPriceDecimal: 100,
      concentration: { startTick: 50, endTick: 150 },
    })

    // With the current zoomConfig padding, this yields 110 ticks visible → ceil(110/33)=4
    expect(grouping.groupSizeTicks).toBe(4)
    expect(grouping.medianOffsetTicks).toBe(1)
  })

  test('groupTickBars sums volume and uses the median tick (lower median for even group size)', () => {
    const bars = makeBars({ count: 20, tickSize: 1 })

    const grouped = groupTickBars({
      bars,
      tickSizeDecimal: 1,
      minBidTickDecimal: 5, // anchor median around tick 5
      grouping: { groupSizeTicks: 4, medianOffsetTicks: 1 },
    })

    // Ensure the group containing the min-bid tick uses that tick as the representative median tick.
    expect(grouped.some((g) => g.tick === 5)).toBe(true)

    // All non-edge groups should have summed amount = 4 (since we gave each bar amount=1)
    const nonEdge = grouped.slice(1, grouped.length - 1)
    for (const g of nonEdge) {
      expect(g.amount).toBe(4)
    }
  })
})
