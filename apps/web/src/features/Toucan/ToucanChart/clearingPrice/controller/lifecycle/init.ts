import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  LineStyle,
  LineType,
  type MouseEventParams,
  type Time,
} from 'lightweight-charts'
import { opacify } from 'ui/src/theme'
import { createClearingPriceChartOptions } from '~/features/Toucan/ToucanChart/clearingPrice/controller/chartOptions'
import type { ClearingPriceChartControllerCreateParams } from '~/features/Toucan/ToucanChart/clearingPrice/types'

interface InitClearingPriceChartResult {
  chart: IChartApi
  series: ISeriesApi<'Area'>
  /** Area series for the pre-bid portion — rendered with a dashed line and the same area fill. */
  preBidSeries: ISeriesApi<'Area'>
  teardown: () => void
  /** Deferred subscription setup - call AFTER first setData to avoid internal errors */
  subscribeVisibleRangeChanges: () => void
}

/**
 * Initialize the clearing price chart with lightweight-charts.
 *
 * Responsibilities:
 * - Create the chart instance
 * - Add the area series
 * - Set up event subscriptions
 * - Return teardown function for cleanup
 */
export function initClearingPriceChart(params: {
  createParams: ClearingPriceChartControllerCreateParams
  container: HTMLDivElement
  onCrosshairMove: (param: MouseEventParams<Time>) => void
  onVisibleRangeChange: (range: { from: Time; to: Time } | null) => void
  onResize: () => void
}): InitClearingPriceChartResult {
  const { createParams, container, onCrosshairMove, onVisibleRangeChange, onResize } = params

  const chart = createChart(
    container,
    createClearingPriceChartOptions({
      width: container.clientWidth,
      height: createParams.height,
      colors: createParams.colors,
    }),
  )

  const lineColor = createParams.tokenColor || createParams.colors.accent1.val
  const series = chart.addAreaSeries({
    priceScaleId: 'left',
    // Apply step line type immediately to prevent smooth curve on initial render
    lineType: LineType.WithSteps,
    lineWidth: 2,
    lineColor,
    topColor: lineColor,
    bottomColor: opacify(0, createParams.colors.surface1.val),
    priceLineVisible: false,
    lastValueVisible: false,
    crosshairMarkerRadius: 0,
  })

  const preBidSeries = chart.addAreaSeries({
    priceScaleId: 'left',
    lineType: LineType.WithSteps,
    lineWidth: 2,
    lineStyle: LineStyle.Dashed,
    lineColor,
    topColor: lineColor,
    bottomColor: opacify(0, createParams.colors.surface1.val),
    priceLineVisible: false,
    lastValueVisible: false,
    crosshairMarkerRadius: 0,
  })

  // Apply scale margins via priceScale().applyOptions rather than createChart options —
  // lightweight-charts honors these reliably only after the scale exists (matches the
  // bidDistribution v1 pattern).
  chart.priceScale('left').applyOptions({
    scaleMargins: {
      top: 0.1,
      bottom: 0.1,
    },
    autoScale: true,
  })

  // Set up event subscriptions (except visible range - deferred until after first setData)
  chart.subscribeCrosshairMove(onCrosshairMove)

  // Use ResizeObserver instead of window resize listener.
  // This handles both window resizes AND container visibility changes (e.g., display: none -> flex).
  // Critical for mobile web where chart container may be hidden initially and shown via navigation.
  const resizeObserver = new ResizeObserver(() => {
    onResize()
  })
  resizeObserver.observe(container)

  // Deferred subscription setup - call this AFTER first setData to avoid lightweight-charts
  // internal errors when range change events fire before data is loaded.
  const subscribeVisibleRangeChanges = () => {
    chart.timeScale().subscribeVisibleTimeRangeChange(onVisibleRangeChange)
  }

  const teardown = () => {
    chart.unsubscribeCrosshairMove(onCrosshairMove)
    chart.timeScale().unsubscribeVisibleTimeRangeChange(onVisibleRangeChange)
    resizeObserver.disconnect()
  }

  return {
    chart,
    series,
    preBidSeries,
    teardown,
    subscribeVisibleRangeChanges,
  }
}
