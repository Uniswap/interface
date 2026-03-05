import type { IChartApi, ISeriesApi } from 'lightweight-charts'
import { findClearingPriceCoordinate } from '~/components/Charts/ToucanChart/bidDistribution/controller/logic/clearingPriceCoordinate'
import type {
  ToucanBidDistributionChartControllerUpdateParams,
  ToucanClearingPriceTooltipState,
} from '~/components/Charts/ToucanChart/bidDistribution/types'
import type { ToucanChartSeriesOptions } from '~/components/Charts/ToucanChart/renderer'

type BarData = { tick: number; amount: number }

/**
 * Find the bar with the tick closest to the target tick.
 * Works for both individual ticks and grouped ticks.
 */
function findNearestBar({ bars, targetTick }: { bars: BarData[]; targetTick: number }): BarData | undefined {
  if (bars.length === 0) {
    return undefined
  }

  let nearestBar = bars[0]
  let minDistance = Math.abs(bars[0].tick - targetTick)

  for (const bar of bars) {
    const distance = Math.abs(bar.tick - targetTick)
    if (distance < minDistance) {
      minDistance = distance
      nearestBar = bar
    }
  }

  return nearestBar
}

/**
 * Compute the position and visibility of the clearing price tooltip.
 * The tooltip is shown when hovering the clearing price line.
 */
export function computeClearingPriceTooltipState(params: {
  chart: IChartApi | null
  series: ISeriesApi<'Custom'> | null
  next: ToucanBidDistributionChartControllerUpdateParams
}): ToucanClearingPriceTooltipState {
  const { chart, series, next } = params

  const defaultState: ToucanClearingPriceTooltipState = {
    left: 0,
    top: 0,
    isVisible: false,
    clearingPriceDecimal: 0,
    volumeAtClearingPrice: 0,
    totalBidVolume: 0,
  }

  if (!chart || !series) {
    return defaultState
  }

  // Check if hovering the clearing price line
  const options = series.options() as ToucanChartSeriesOptions & { isHoveringClearingPrice?: boolean }
  const isVisible = options.isHoveringClearingPrice ?? false

  if (!isVisible) {
    return defaultState
  }

  // Find the x coordinate for the clearing price
  const clearingPriceCoordinate = findClearingPriceCoordinate({
    chart,
    clearingPrice: next.clearingPriceDecimal,
    bars: next.barsForMarkers,
    priceScaleFactor: next.priceScaleFactor,
  })

  if (clearingPriceCoordinate === null) {
    return defaultState
  }

  // Add y-axis width to convert from pane-relative to container-relative coordinates
  const priceScaleWidth = chart.priceScale('left').width()

  // Find volume at nearest tick to clearing price
  // Uses nearest bar instead of exact match since clearing price may fall between ticks
  const nearestBar = findNearestBar({ bars: next.barsForMarkers, targetTick: next.clearingPriceDecimal })
  const volumeAtClearingPrice = nearestBar?.amount ?? 0

  return {
    left: clearingPriceCoordinate + priceScaleWidth,
    top: 0, // Position is handled via CLEARING_PRICE_LINE.LABEL_OFFSET_Y in the component
    isVisible: true,
    clearingPriceDecimal: next.clearingPriceDecimal,
    volumeAtClearingPrice,
    totalBidVolume: next.totalBidVolume,
  }
}
