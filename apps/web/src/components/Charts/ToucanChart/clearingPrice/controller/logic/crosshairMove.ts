import type { IChartApi, ISeriesApi, MouseEventParams, Time } from 'lightweight-charts'
import type {
  ClearingPriceChartPoint,
  ClearingPriceTooltipState,
} from '~/components/Charts/ToucanChart/clearingPrice/types'

interface HandleCrosshairMoveParams {
  param: MouseEventParams<Time>
  chart: IChartApi
  series: ISeriesApi<'Area'>
  onTooltipStateChange: (state: ClearingPriceTooltipState | null) => void
}

/**
 * Calculates tooltip position and determines whether it should flip
 * to the left side when near the right edge of the chart.
 */
export function handleClearingPriceCrosshairMove(params: HandleCrosshairMoveParams): void {
  const { param, chart, series, onTooltipStateChange } = params

  // No hover data - hide tooltip
  if (!param.point || !param.time) {
    onTooltipStateChange(null)
    return
  }

  const data = param.seriesData.get(series) as ClearingPriceChartPoint | undefined
  if (!data) {
    onTooltipStateChange(null)
    return
  }

  const priceScaleWidth = chart.priceScale('left').width()
  const chartWidth = chart.paneSize().width
  const x = param.point.x + priceScaleWidth

  // Determine if we should flip to the left side
  // Flip when we're past 60% of the chart width
  const flipThreshold = chartWidth * 0.6
  const flipLeft = param.point.x > flipThreshold

  // Vertical positioning - keep tooltip near top of chart
  const y = Math.max(10, Math.min(param.point.y, 60))

  onTooltipStateChange({
    x,
    y,
    flipLeft,
    data,
  })
}

export function calculateTooltipTransform(state: ClearingPriceTooltipState): string {
  const tooltipOffset = 12

  let transformX: string
  if (state.flipLeft) {
    // Position to the left of the crosshair
    transformX = `calc(${state.x - tooltipOffset}px - 100%)`
  } else {
    // Position to the right of the crosshair
    transformX = `calc(${state.x + tooltipOffset}px)`
  }

  const transformY = `${state.y}px`

  return `translate(${transformX}, ${transformY})`
}
