import { useEffect, useMemo, useRef } from 'react'
import {
  computeTickGroupingConfig,
  type GroupedTickBar,
  groupTickBars,
  type TickGroupingConfig,
} from '~/components/Charts/ToucanChart/bidDistribution/utils/tickGrouping'
import { fromQ96ToDecimalWithTokenDecimals } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import type { ProcessedChartData } from '~/components/Toucan/Auction/BidDistributionChart/utils/utils'
import { useAuctionStore, useAuctionStoreActions } from '~/components/Toucan/Auction/store/useAuctionStore'

interface UseTickGroupingParams {
  chartData: ProcessedChartData
  clearingPrice: string
  tickSize: string
  bidTokenDecimals?: number
  auctionTokenDecimals?: number
  chartMode?: 'distribution' | 'demand'
}

interface UseTickGroupingResult {
  groupTicksEnabled: boolean
  tickGrouping: TickGroupingConfig | null
  groupedBars: GroupedTickBar[] | null
  barsForMarkers: { tick: number; amount: number; tickQ96?: string }[]
  effectiveUserBidPriceDecimal: number | null
  clearingPriceDecimal: number
  clearingPriceBigInt: bigint | null
  tickSizeDecimal: number
  minBidTickDecimal: number
  concentration: ProcessedChartData['concentration']
}

export function useTickGrouping({
  chartData,
  clearingPrice,
  tickSize,
  bidTokenDecimals,
  auctionTokenDecimals,
  chartMode,
}: UseTickGroupingParams): UseTickGroupingResult {
  const groupTicksEnabled = useAuctionStore((state) => state.groupTicksEnabled)
  const userBidPrice = useAuctionStore((state) => state.userBidPrice)
  const { setTickGrouping } = useAuctionStoreActions()

  // Q96 inputs are contract-format values. We convert once so all downstream math operates on plain decimals.
  const clearingPriceDecimal = useMemo(
    () => fromQ96ToDecimalWithTokenDecimals({ q96Value: clearingPrice, bidTokenDecimals, auctionTokenDecimals }),
    [auctionTokenDecimals, bidTokenDecimals, clearingPrice],
  )
  const tickSizeDecimal = useMemo(
    () => fromQ96ToDecimalWithTokenDecimals({ q96Value: tickSize, bidTokenDecimals, auctionTokenDecimals }),
    [auctionTokenDecimals, bidTokenDecimals, tickSize],
  )
  const clearingPriceBigInt = useMemo(() => {
    try {
      return BigInt(clearingPrice)
    } catch {
      return null
    }
  }, [clearingPrice])

  const concentration = chartData.concentration

  const minBidTickDecimal = useMemo(() => {
    if (!Number.isFinite(clearingPriceDecimal) || !Number.isFinite(tickSizeDecimal) || tickSizeDecimal <= 0) {
      return Number.NaN
    }
    return clearingPriceDecimal + tickSizeDecimal
  }, [clearingPriceDecimal, tickSizeDecimal])

  const tickGrouping = useMemo(() => {
    if (!groupTicksEnabled) {
      return null
    }
    return computeTickGroupingConfig({
      bars: chartData.bars,
      minTick: chartData.minTick,
      maxTick: chartData.maxTick,
      tickSizeDecimal,
      clearingPriceDecimal,
      concentration: concentration ? { startTick: concentration.startTick, endTick: concentration.endTick } : null,
    })
  }, [
    chartData.bars,
    chartData.maxTick,
    chartData.minTick,
    clearingPriceDecimal,
    concentration,
    groupTicksEnabled,
    tickSizeDecimal,
  ])

  const userBidPriceDecimal = useMemo(() => {
    if (!userBidPrice) {
      return null
    }
    const parsed = parseFloat(userBidPrice)
    return Number.isFinite(parsed) ? parsed : null
  }, [userBidPrice])

  // Publish grouping to the store so other inputs (slider) can snap consistently.
  useEffect(() => {
    if (groupTicksEnabled) {
      setTickGrouping(tickGrouping)
    } else {
      setTickGrouping(null)
    }
  }, [groupTicksEnabled, setTickGrouping, tickGrouping])

  // Compute groupedBars before effectiveUserBidPriceDecimal so we can use actual bar tick values
  const groupedBars = useMemo(() => {
    if (!groupTicksEnabled || !tickGrouping || !Number.isFinite(minBidTickDecimal)) {
      return null
    }
    return groupTickBars({
      bars: chartData.bars,
      tickSizeDecimal,
      minBidTickDecimal,
      grouping: tickGrouping,
    })
  }, [chartData.bars, groupTicksEnabled, minBidTickDecimal, tickGrouping, tickSizeDecimal])

  const effectiveUserBidPriceDecimal = useMemo(() => {
    if (!groupTicksEnabled || !tickGrouping || userBidPriceDecimal == null) {
      return userBidPriceDecimal
    }
    if (!Number.isFinite(minBidTickDecimal) || !Number.isFinite(tickSizeDecimal) || tickSizeDecimal <= 0) {
      return userBidPriceDecimal
    }

    // Calculate which group the user's bid falls into
    const offsetTicks = Math.round((userBidPriceDecimal - minBidTickDecimal) / tickSizeDecimal)
    const groupIndex = Math.round(offsetTicks / tickGrouping.groupSizeTicks)

    // If we have grouped bars, find the bar at this group index and use its actual tick value
    // This ensures exact match with bar.tickValue in the renderer's isUserBidBar check
    if (groupedBars && groupedBars.length > 0) {
      // Find the bar that corresponds to this group
      // Bars are sorted by tick, so we need to find by group index calculation
      for (const bar of groupedBars) {
        const barOffsetTicks = Math.round((bar.tick - minBidTickDecimal) / tickSizeDecimal)
        const barGroupIndex = Math.round(barOffsetTicks / tickGrouping.groupSizeTicks)
        if (barGroupIndex === groupIndex) {
          return bar.tick // Use the actual bar's tick value for exact match
        }
      }
    }

    // Fallback: calculate theoretically (may not match exactly due to floating point)
    const snappedOffsetTicks = groupIndex * tickGrouping.groupSizeTicks
    return minBidTickDecimal + (snappedOffsetTicks + tickGrouping.medianOffsetTicks) * tickSizeDecimal
  }, [minBidTickDecimal, tickGrouping, tickSizeDecimal, userBidPriceDecimal, groupTicksEnabled, groupedBars])

  // Track previous barsForMarkers to avoid creating new references when content is unchanged
  const prevBarsForMarkersRef = useRef<{ tick: number; amount: number; tickQ96?: string }[]>([])

  const barsForMarkers = useMemo(() => {
    const sourceBars = chartMode === 'distribution' && groupTicksEnabled && groupedBars ? groupedBars : chartData.bars
    const newBars = sourceBars.map((bar) => ({
      tick: bar.tick,
      amount: bar.amount,
      tickQ96: 'tickQ96' in bar ? bar.tickQ96 : undefined,
    }))

    // Compare with previous - if identical, return same reference to prevent downstream re-renders
    const prev = prevBarsForMarkersRef.current
    if (
      prev.length === newBars.length &&
      prev.every(
        (p, i: number) =>
          p.tick === newBars[i].tick && p.amount === newBars[i].amount && p.tickQ96 === newBars[i].tickQ96,
      )
    ) {
      return prev
    }

    prevBarsForMarkersRef.current = newBars
    return newBars
  }, [chartData.bars, chartMode, groupTicksEnabled, groupedBars])

  return {
    groupTicksEnabled,
    tickGrouping,
    groupedBars,
    barsForMarkers,
    effectiveUserBidPriceDecimal,
    clearingPriceDecimal,
    clearingPriceBigInt,
    tickSizeDecimal,
    minBidTickDecimal,
    concentration,
  }
}
