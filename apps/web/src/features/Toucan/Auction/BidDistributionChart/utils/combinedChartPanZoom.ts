import type { ChartBarData, ProcessedChartData } from '~/features/Toucan/Auction/BidDistributionChart/utils/utils'
import { BAR_PIXEL_PITCH } from '~/features/Toucan/Auction/BidDistributionChart/utils/viewAdaptiveBars'
import { groupTickBars } from '~/features/Toucan/ToucanChart/bidDistribution/utils/tickGrouping'

const DEFAULT_TARGET_GROUPED_BARS = 80

/**
 * In the no-bids empty state the floor price line sits at this fraction of the
 * chart height, measured from the bottom, so the chart doesn't look totally
 * empty (LP-806).
 */
const NO_BIDS_FLOOR_HEIGHT_FRACTION = 0.2
/** Fraction of the floor price kept visible below the floor line in the no-bids state. */
const NO_BIDS_LOWER_MARGIN_FRACTION = 0.1

/**
 * Caps how far the concentration band and bid-volume range can extend the default
 * y-axis beyond the price range, expressed as a multiple of the price range on each
 * side. Keeps the price line visually dominant at default zoom (LP-802). Users can
 * still pan/zoom to reveal bars outside this window.
 */
const MAX_EXPANSION_MULTIPLIER = 0.5

interface NormalizedDataSlice {
  yMin: number
  yMax: number
  scaleFactor: number
}

/**
 * Returns the tick range containing the central 95% of cumulative volume,
 * trimming extreme outliers on both ends so they don't dominate the Y-axis.
 */
function computeVolumeRange(bars: ChartBarData[] | undefined): { min: number; max: number } | null {
  if (!bars || bars.length === 0) {
    return null
  }
  const withVolume = bars.filter((b) => b.amount > 0).sort((a, b) => a.tick - b.tick)
  if (withVolume.length === 0) {
    return null
  }
  const total = withVolume.reduce((sum, b) => sum + b.amount, 0)
  if (total <= 0) {
    return null
  }
  const loTarget = total * 0.025
  const hiTarget = total * 0.975
  let cum = 0
  let lo = withVolume[0].tick
  let hi = withVolume[withVolume.length - 1].tick
  for (const b of withVolume) {
    const prev = cum
    cum += b.amount
    if (prev < loTarget && cum >= loTarget) {
      lo = b.tick
    }
    if (prev < hiTarget && cum >= hiTarget) {
      hi = b.tick
      break
    }
  }
  return { min: lo, max: hi }
}

/**
 * Computes the default visible y-axis window for the no-bids empty state:
 * the clearing price line is flat at the floor price, so anchor the floor at
 * NO_BIDS_FLOOR_HEIGHT_FRACTION of the chart height with headroom above (LP-806).
 * Returns null when the floor price is invalid.
 */
export function computeNoBidsViewRange(floorPrice: number): { yMin: number; yMax: number } | null {
  if (!Number.isFinite(floorPrice) || floorPrice <= 0) {
    return null
  }
  const yMin = floorPrice * (1 - NO_BIDS_LOWER_MARGIN_FRACTION)
  const totalRange = (floorPrice - yMin) / NO_BIDS_FLOOR_HEIGHT_FRACTION
  return { yMin, yMax: yMin + totalRange }
}

/**
 * Applies pan offset and zoom to produce updated y-axis bounds.
 * Centers the visible window around the union of price history, concentration band,
 * and (when available) the trimmed volume range so outlier volume bars stay in view.
 * When `noBidsFloorPrice` is set (auction started, zero bids), the default window
 * anchors the floor price near the bottom of the chart instead.
 */
export function applyPanZoom<T extends NormalizedDataSlice>(params: {
  normalizedData: T
  concentration: { startTick: number; endTick: number } | null | undefined
  bars?: ChartBarData[]
  yPanOffset: number
  yZoomLevel: number
  noBidsFloorPrice?: number
}): T & { scaledYMin: number; scaledYMax: number } {
  const { normalizedData, concentration, bars, yPanOffset, yZoomLevel, noBidsFloorPrice } = params
  const { scaleFactor } = normalizedData

  const volumeRange = computeVolumeRange(bars)

  const priceYMin = normalizedData.yMin
  const priceYMax = normalizedData.yMax
  const priceRange = Math.max(priceYMax - priceYMin, 0)
  const maxExpansion = priceRange * MAX_EXPANSION_MULTIPLIER

  let baseYMin = priceYMin
  let baseYMax = priceYMax
  if (concentration) {
    baseYMin = Math.min(baseYMin, concentration.startTick)
    baseYMax = Math.max(baseYMax, concentration.endTick)
  }
  if (volumeRange) {
    baseYMin = Math.min(baseYMin, volumeRange.min)
    baseYMax = Math.max(baseYMax, volumeRange.max)
  }
  if (priceRange > 0) {
    baseYMin = Math.max(baseYMin, priceYMin - maxExpansion)
    baseYMax = Math.min(baseYMax, priceYMax + maxExpansion)
  }

  const noBidsRange = noBidsFloorPrice !== undefined ? computeNoBidsViewRange(noBidsFloorPrice) : null

  const baseRange = baseYMax - baseYMin || Math.max(baseYMax * 0.1, 0.001)
  const buffer = baseRange * 0.1
  const bufferedMin = noBidsRange ? noBidsRange.yMin : Math.max(0, baseYMin - buffer)
  const bufferedMax = noBidsRange ? noBidsRange.yMax : baseYMax + buffer
  const bufferedRange = bufferedMax - bufferedMin
  const halfRange = bufferedRange / yZoomLevel / 2
  const baseMidpoint = (bufferedMin + bufferedMax) / 2
  const center = baseMidpoint + yPanOffset
  const yMin = Math.max(0, center - halfRange)
  const yMax = center + halfRange

  return {
    ...normalizedData,
    yMin,
    yMax,
    scaledYMin: yMin * scaleFactor,
    scaledYMax: yMax * scaleFactor,
  }
}

/**
 * Computes the allowable pan offset range based on the distribution bar extent.
 * Returns null if there is insufficient data to determine bounds.
 */
export function computePanBounds(params: {
  normalizedData: NormalizedDataSlice
  bars: ChartBarData[]
  yZoomLevel: number
}): { min: number; max: number } | null {
  const { normalizedData, bars, yZoomLevel } = params
  const baseRange = normalizedData.yMax - normalizedData.yMin
  if (baseRange <= 0) {
    return null
  }
  const zoomedRange = baseRange / yZoomLevel
  const minOffset = -baseRange * 2
  const maxBarTick = bars.length > 0 ? bars.reduce((m, b) => Math.max(m, b.tick), -Infinity) : 0
  const offsetToReachMaxBar = maxBarTick - normalizedData.yMax + zoomedRange * 0.1
  const maxOffset = Math.max(baseRange * 2, offsetToReachMaxBar)
  return { min: minOffset, max: maxOffset }
}

/**
 * Groups distribution bars based on the current zoom level so that the number
 * of rendered bars stays near the Y-axis row capacity (one bar per pixel row of
 * height BAR_PIXEL_PITCH). When chartHeightPx is omitted, falls back to a fixed
 * target. Returns the original bars when no grouping is needed.
 */
export function computeViewGroupedBars(params: {
  chartData: ProcessedChartData
  yMin: number | undefined
  yMax: number | undefined
  tickSizeDecimal: number
  clearingPriceDecimal: number | undefined
  yZoomLevel: number
  chartHeightPx?: number
}): ChartBarData[] {
  const { chartData, yMin, yMax, tickSizeDecimal, clearingPriceDecimal, yZoomLevel, chartHeightPx } = params

  if (!tickSizeDecimal || tickSizeDecimal <= 0 || !Number.isFinite(tickSizeDecimal)) {
    return chartData.bars
  }

  const targetGroupedBars =
    chartHeightPx && chartHeightPx > 0
      ? Math.max(20, Math.floor(chartHeightPx / BAR_PIXEL_PITCH))
      : DEFAULT_TARGET_GROUPED_BARS

  const viewMin = chartData.concentration
    ? Math.min(yMin ?? chartData.minTick, chartData.concentration.startTick)
    : (yMin ?? chartData.minTick)
  const viewMax = chartData.concentration
    ? Math.max(yMax ?? chartData.maxTick, chartData.concentration.endTick)
    : (yMax ?? chartData.maxTick)
  const baseRange = viewMax - viewMin
  const viewRange = (baseRange * 1.2) / yZoomLevel

  if (!Number.isFinite(viewRange) || viewRange <= 0) {
    return chartData.bars
  }

  // Bars are spaced by barStep (which may be >> tickSizeDecimal when tickSize is sub-wei).
  // Grouping operates on bar indices, so measure "how many bars are in view" using barStep.
  const stepSize =
    chartData.barStep && Number.isFinite(chartData.barStep) && chartData.barStep > 0
      ? chartData.barStep
      : tickSizeDecimal
  const barsInView = Math.round(viewRange / stepSize)
  if (barsInView <= targetGroupedBars || !Number.isFinite(barsInView)) {
    return chartData.bars
  }

  const groupSizeTicks = Math.max(1, Math.ceil(barsInView / targetGroupedBars))
  const medianOffsetTicks = Math.floor((groupSizeTicks - 1) / 2)
  const minBidTickDecimal = clearingPriceDecimal !== undefined ? clearingPriceDecimal + stepSize : chartData.minTick

  try {
    const grouped = groupTickBars({
      bars: chartData.bars,
      tickSizeDecimal,
      barStep: chartData.barStep,
      minBidTickDecimal,
      grouping: { groupSizeTicks, medianOffsetTicks },
    })

    return grouped.map(
      (g, i): ChartBarData => ({
        tick: g.tick,
        tickQ96: g.tickQ96,
        tickDisplay: g.tick.toString(),
        amount: g.amount,
        index: i,
      }),
    )
  } catch {
    return chartData.bars
  }
}
