import type { IChartApi, ISeriesApi, MouseEventParams, Time, UTCTimestamp } from 'lightweight-charts'
import { ToucanChartBarTooltipState } from '~/components/Charts/ToucanChart/bidDistribution/types'
import type { ToucanChartData } from '~/components/Charts/ToucanChart/renderer'
import { TOOLTIP_CONFIG } from '~/components/Toucan/Auction/BidDistributionChart/constants'

/** Estimated tooltip width for position calculations (actual width may vary) */
const ESTIMATED_TOOLTIP_WIDTH = 140

export function handleToucanCrosshairMove({
  param,
  chart,
  series,
  containerWidth,
  containerHeight,
  priceScaleFactor,
  clearingPriceDecimal,
  totalBidVolume,
  setSeriesHoverState,
  onChartBarTooltipStateChange,
  onRequestOverlayUpdate,
}: {
  param: MouseEventParams<Time>
  chart: IChartApi
  series: ISeriesApi<'Custom'>
  containerWidth: number
  containerHeight: number
  priceScaleFactor: number
  clearingPriceDecimal: number
  totalBidVolume: number
  setSeriesHoverState: (state: { hoveredTickValue: number | null; isHoveringClearingPrice: boolean }) => void
  onChartBarTooltipStateChange: (state: ToucanChartBarTooltipState) => void
  /** Called when overlays need to refresh (e.g. when hovering clearing price). */
  onRequestOverlayUpdate: () => void
}): void {
  const { point, time, seriesData } = param

  const hideTooltip = (): void => {
    onChartBarTooltipStateChange({
      left: 0,
      top: 0,
      isVisible: false,
      tickValue: 0,
      volumeAmount: 0,
      totalVolume: 0,
    })
  }

  if (!point || time == null) {
    hideTooltip()
    setSeriesHoverState({ hoveredTickValue: null, isHoveringClearingPrice: false })
    return
  }

  const data = seriesData.get(series as Parameters<typeof seriesData.get>[0]) as ToucanChartData | undefined
  if (!data) {
    hideTooltip()
    setSeriesHoverState({ hoveredTickValue: null, isHoveringClearingPrice: false })
    return
  }

  const tickValue = data.tickValue ?? Number(data.time) / priceScaleFactor
  const volumeAmount = data.value

  if (!Number.isFinite(tickValue)) {
    setSeriesHoverState({ hoveredTickValue: null, isHoveringClearingPrice: false })
    return
  }

  // NOTE: lightweight-charts expects finite integer timestamps for all time-scale conversions.
  // During zoom/scale gestures, this handler can be called at high frequency; any NaN/Infinity
  // passed into timeToCoordinate can trigger internal recursion / stack overflows.
  const safeTimeToCoordinate = (timeValue: number): number | null => {
    if (!Number.isFinite(timeValue) || !Number.isSafeInteger(timeValue)) {
      return null
    }
    try {
      return chart.timeScale().timeToCoordinate(timeValue as UTCTimestamp)
    } catch {
      return null
    }
  }

  // Clearing price hover detection (pixel threshold)
  let isHoveringClearingPrice = false
  const exactScaledTime = clearingPriceDecimal * priceScaleFactor

  const canCheckClearingPriceHover =
    Number.isFinite(clearingPriceDecimal) && Number.isFinite(priceScaleFactor) && priceScaleFactor > 0

  const floorTime = canCheckClearingPriceHover ? Math.floor(exactScaledTime) : Number.NaN
  const ceilTime = canCheckClearingPriceHover ? Math.ceil(exactScaledTime) : Number.NaN

  const x1 = safeTimeToCoordinate(floorTime)
  const x2 = safeTimeToCoordinate(ceilTime)

  let clearingPriceX: number | null = null
  if (x1 !== null && x2 !== null) {
    if (x1 === x2) {
      clearingPriceX = x1
    } else {
      const fraction = exactScaledTime - Math.floor(exactScaledTime)
      clearingPriceX = x1 + fraction * (x2 - x1)
    }
  } else if (x1 !== null) {
    clearingPriceX = x1
  } else if (x2 !== null) {
    clearingPriceX = x2
  }

  if (clearingPriceX !== null && Math.abs(point.x - clearingPriceX) < 15) {
    isHoveringClearingPrice = true
  }

  setSeriesHoverState({ hoveredTickValue: tickValue, isHoveringClearingPrice })

  if (isHoveringClearingPrice) {
    hideTooltip()
    onRequestOverlayUpdate()
    return
  }

  // IMPORTANT: Do NOT call `chart.applyOptions(...)` inside the crosshair-move callback.
  // lightweight-charts may synchronously trigger recalculations that re-enter this callback
  // (especially during zoom/scale gestures), leading to stack overflows.

  // Calculate tooltip position with bounds checking
  // Note: point.x and point.y are Coordinate branded types, cast to number for arithmetic
  const pointX = point.x as number
  const pointY = point.y as number
  const halfTooltipWidth = ESTIMATED_TOOLTIP_WIDTH / 2
  let adjustedX = pointX - halfTooltipWidth + TOOLTIP_CONFIG.HORIZONTAL_OFFSET
  if (adjustedX < 0) {
    adjustedX = 0
  } else if (adjustedX + ESTIMATED_TOOLTIP_WIDTH > containerWidth) {
    adjustedX = containerWidth - ESTIMATED_TOOLTIP_WIDTH
  }

  let adjustedY = pointY
  // Approximate tooltip height for bounds checking
  const estimatedTooltipHeight = volumeAmount > 0 ? 80 : 30
  if (pointY - estimatedTooltipHeight < 0) {
    adjustedY = estimatedTooltipHeight
  } else if (pointY > containerHeight) {
    adjustedY = containerHeight
  }

  onChartBarTooltipStateChange({
    left: adjustedX,
    top: adjustedY,
    isVisible: true,
    tickValue,
    volumeAmount,
    totalVolume: totalBidVolume,
  })
}
