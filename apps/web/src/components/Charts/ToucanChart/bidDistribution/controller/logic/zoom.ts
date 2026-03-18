import type { IChartApi, UTCTimestamp } from 'lightweight-charts'
import type { ToucanBidDistributionChartZoomState } from '~/components/Charts/ToucanChart/bidDistribution/types'
import { ChartMode } from '~/components/Charts/ToucanChart/renderer'
import { ZOOM_DEFAULTS, ZOOM_TOLERANCE } from '~/components/Toucan/Auction/BidDistributionChart/constants'
import {
  calculateInitialVisibleRange,
  getPaddedConcentrationRange,
} from '~/components/Toucan/Auction/BidDistributionChart/utils/utils'
import {
  BID_DEMAND_INITIAL_ZOOM,
  BID_DISTRIBUTION_INITIAL_ZOOM,
} from '~/components/Toucan/Auction/BidDistributionChart/zoomConfig'

function clamp({ n, min, max }: { n: number; min: number; max: number }): number {
  return Math.min(max, Math.max(min, n))
}

function coerceVisibleRangeToData(params: {
  targetFrom: number
  targetTo: number
  minTick: number
  maxTick: number
  priceScaleFactor: number
}): { from: UTCTimestamp; to: UTCTimestamp } | null {
  const { targetFrom, targetTo, minTick, maxTick, priceScaleFactor } = params

  if (!Number.isFinite(priceScaleFactor) || priceScaleFactor <= 0) {
    return null
  }

  const fullFrom = Math.round(minTick * priceScaleFactor)
  const fullTo = Math.round(maxTick * priceScaleFactor)
  if (
    !Number.isFinite(fullFrom) ||
    !Number.isFinite(fullTo) ||
    !Number.isSafeInteger(fullFrom) ||
    !Number.isSafeInteger(fullTo)
  ) {
    return null
  }

  const minBound = Math.min(fullFrom, fullTo)
  const maxBound = Math.max(fullFrom, fullTo)

  if (!Number.isFinite(targetFrom) || !Number.isFinite(targetTo)) {
    return null
  }

  let from = clamp({ n: Math.round(Math.min(targetFrom, targetTo)), min: minBound, max: maxBound })
  let to = clamp({ n: Math.round(Math.max(targetFrom, targetTo)), min: minBound, max: maxBound })

  // lightweight-charts expects a non-zero range and strongly prefers ranges that intersect data.
  // If we collapsed to a single value, expand minimally within bounds.
  if (to === from) {
    if (to < maxBound) {
      to = to + 1
    } else if (from > minBound) {
      from = from - 1
    }
  }

  return { from: from as UTCTimestamp, to: to as UTCTimestamp }
}

export function applyZoomFromState(params: {
  chart: IChartApi
  hasInitializedRange: boolean
  chartZoomState: ToucanBidDistributionChartZoomState
  concentration: { startTick: number; endTick: number } | null
  clearingPriceDecimal: number
  minTick: number
  maxTick: number
  tickSizeDecimal: number
  priceScaleFactor: number
  chartMode?: ChartMode
}): { hasInitializedRange: boolean } {
  const {
    chart,
    hasInitializedRange,
    chartZoomState,
    concentration,
    clearingPriceDecimal,
    minTick,
    maxTick,
    tickSizeDecimal,
    priceScaleFactor,
    chartMode,
  } = params

  let targetFrom: number
  let targetTo: number

  if (chartZoomState.visibleRange) {
    targetFrom = Math.round(chartZoomState.visibleRange.from * priceScaleFactor)
    targetTo = Math.round(chartZoomState.visibleRange.to * priceScaleFactor)
  } else if (chartMode === 'demand') {
    if (concentration) {
      // Left edge: clearing price minus a few ticks
      const leftEdge = clearingPriceDecimal - BID_DEMAND_INITIAL_ZOOM.ticksBelowClearingPrice * tickSizeDecimal
      // Right edge: end of concentration band + padding
      const fullTickCount = Math.max(1, Math.round((maxTick - minTick) / tickSizeDecimal))
      const padAfterTicks = Math.max(
        BID_DEMAND_INITIAL_ZOOM.minPadTicksAfter,
        Math.round(fullTickCount * BID_DEMAND_INITIAL_ZOOM.afterConcentrationPercentOfFullRange),
      )
      const rightEdge = concentration.endTick + padAfterTicks * tickSizeDecimal
      targetFrom = Math.round(Math.max(minTick, leftEdge) * priceScaleFactor)
      targetTo = Math.round(Math.min(maxTick, rightEdge) * priceScaleFactor)
    } else {
      // Fallback: no concentration data — use clearing price + tick count
      const initial = calculateInitialVisibleRange({
        clearingPrice: clearingPriceDecimal,
        minTick,
        maxTick,
        tickSize: tickSizeDecimal,
        initialTickCount: ZOOM_DEFAULTS.INITIAL_TICK_COUNT,
      })
      targetFrom = Math.round(initial.from * priceScaleFactor)
      targetTo = Math.round(initial.to * priceScaleFactor)
    }
  } else if (concentration) {
    // Use concentration-based initial zoom for distribution mode
    const padded = getPaddedConcentrationRange({
      startTick: concentration.startTick,
      endTick: concentration.endTick,
      minTick,
      maxTick,
      tickSizeDecimal,
      beforePercentOfFullRange: BID_DISTRIBUTION_INITIAL_ZOOM.concentrationPadding.beforePercentOfFullRange,
      afterPercentOfFullRange: BID_DISTRIBUTION_INITIAL_ZOOM.concentrationPadding.afterPercentOfFullRange,
      minPadTicks: BID_DISTRIBUTION_INITIAL_ZOOM.concentrationPadding.minPadTicks,
    })
    targetFrom = Math.round(padded.from * priceScaleFactor)
    targetTo = Math.round(padded.to * priceScaleFactor)
  } else {
    // Fallback: no concentration data - use clearing price + tick count
    const initial = calculateInitialVisibleRange({
      clearingPrice: clearingPriceDecimal,
      minTick,
      maxTick,
      tickSize: tickSizeDecimal,
      initialTickCount: ZOOM_DEFAULTS.INITIAL_TICK_COUNT,
    })
    targetFrom = Math.round(initial.from * priceScaleFactor)
    targetTo = Math.round(initial.to * priceScaleFactor)
  }

  const coerced = coerceVisibleRangeToData({ targetFrom, targetTo, minTick, maxTick, priceScaleFactor })
  if (!coerced) {
    return { hasInitializedRange }
  }

  // On first initialization, lightweight-charts may not be ready to report or accept visible ranges.
  // Call fitContent() first to ensure the chart processes the data, then set our desired range.
  if (!hasInitializedRange) {
    try {
      chart.timeScale().fitContent()
      chart.timeScale().setVisibleRange({
        from: coerced.from,
        to: coerced.to,
      })
      return { hasInitializedRange: true }
    } catch {
      // Chart not ready yet - fitContent() alone should at least show the data
      return { hasInitializedRange: true }
    }
  }

  // After initialization, handle zoom state updates from the store
  try {
    const currentRange = chart.timeScale().getVisibleRange()
    if (currentRange) {
      if (chartZoomState.visibleRange) {
        const currentFrom = currentRange.from as number
        const currentTo = currentRange.to as number

        // Only update if the range has changed significantly
        if (Math.abs(currentFrom - coerced.from) > 1 || Math.abs(currentTo - coerced.to) > 1) {
          chart.timeScale().setVisibleRange({
            from: coerced.from,
            to: coerced.to,
          })
        }
      } else {
        // visibleRange is null → re-apply initial zoom (concentration-based or fallback)
        // This handles the case when switching between grouped/ungrouped ticks
        chart.timeScale().setVisibleRange({
          from: coerced.from,
          to: coerced.to,
        })
      }
    }
  } catch {
    // Ignore errors when chart is not ready
  }

  return { hasInitializedRange }
}

export function captureZoomState(params: {
  chart: IChartApi
  minTime: number
  maxTime: number
  rangePaddingUnits: number
  priceScaleFactor: number
}): ToucanBidDistributionChartZoomState | null {
  const { chart, minTime, maxTime, rangePaddingUnits, priceScaleFactor } = params

  let currentRange
  try {
    currentRange = chart.timeScale().getVisibleRange()
  } catch {
    return null
  }
  if (!currentRange) {
    return null
  }

  const from = currentRange.from as number
  const to = currentRange.to as number
  const fullFrom = minTime - rangePaddingUnits
  const fullTo = maxTime + rangePaddingUnits
  const fullRange = fullTo - fullFrom

  const isZoomedIn =
    Math.abs(from - fullFrom) > fullRange * ZOOM_TOLERANCE ||
    Math.abs(to - fullTo) > fullRange * ZOOM_TOLERANCE ||
    Math.abs(to - from - fullRange) > fullRange * ZOOM_TOLERANCE

  return {
    visibleRange: {
      from: from / priceScaleFactor,
      to: to / priceScaleFactor,
    },
    isZoomed: isZoomedIn,
  }
}
