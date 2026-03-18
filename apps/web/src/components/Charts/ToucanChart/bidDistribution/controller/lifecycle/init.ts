import type { AutoscaleInfo, IChartApi, ISeriesApi, MouseEventParams, Time } from 'lightweight-charts'
import { createChart } from 'lightweight-charts'
import { createToucanBidDistributionChartOptions } from '~/components/Charts/ToucanChart/bidDistribution/controller/chartOptions'
import { createBidLineDot } from '~/components/Charts/ToucanChart/bidDistribution/controller/overlays/bidLineDot'
import { createBidOutOfRangeIndicator } from '~/components/Charts/ToucanChart/bidDistribution/controller/overlays/bidOutOfRangeIndicator'
import { createClearingPriceArrow } from '~/components/Charts/ToucanChart/bidDistribution/controller/overlays/clearingPriceArrow'
import { createLabelsLayer } from '~/components/Charts/ToucanChart/bidDistribution/controller/overlays/labelsLayer'
import type { ToucanBidDistributionChartControllerCreateParams } from '~/components/Charts/ToucanChart/bidDistribution/types'
import { ToucanChartSeries } from '~/components/Charts/ToucanChart/toucan-chart-series'
import { CHART_SCALE_MARGINS } from '~/components/Toucan/Auction/BidDistributionChart/constants'

export function initToucanBidDistributionChart(params: {
  createParams: ToucanBidDistributionChartControllerCreateParams
  container: HTMLDivElement
  onCrosshairMove: (param: MouseEventParams<Time>) => void
  onClick: (param: MouseEventParams<Time>) => void
  onVisibleRangeChange: () => void
  onResize: () => void
  onBidOutOfRangeIndicatorClick: () => void
}): {
  chart: IChartApi
  series: ISeriesApi<'Custom'>
  toucanChartSeries: ToucanChartSeries
  elements: {
    labelsLayer: HTMLDivElement
    clearingPriceArrow: HTMLDivElement
    bidLineDot: HTMLDivElement
    bidOutOfRangeIndicator: HTMLDivElement
  }
  teardown: () => void
  subscribeVisibleRangeChanges: () => void
  unsubscribeVisibleRangeChanges: () => void
} {
  const {
    createParams,
    container,
    onCrosshairMove,
    onClick,
    onVisibleRangeChange,
    onResize,
    onBidOutOfRangeIndicatorClick,
  } = params

  const chart = createChart(
    container,
    createToucanBidDistributionChartOptions({
      width: container.clientWidth,
      height: createParams.height,
      colors: createParams.colors,
      priceFormatter: (price: number) => createParams.formatYAxisLabel(price),
      showYAxis: createParams.chartMode !== 'demand',
    }),
  )

  const toucanChartSeries = new ToucanChartSeries()
  const customSeries = chart.addCustomSeries(toucanChartSeries, {
    priceScaleId: 'left',
    priceLineVisible: false,
    lastValueVisible: false,
    // Constrain Y-axis to always start from 0 - price/volume data should never be negative
    // Always return a valid range to prevent chart from using symmetric default behavior
    autoscaleInfoProvider: (baseImpl: () => AutoscaleInfo | null) => {
      const result = baseImpl()
      // Always return a range starting at 0, with a fallback maxValue if no data
      const maxValue = result ? result.priceRange.maxValue : 0
      return {
        priceRange: {
          minValue: 0,
          // Use a small positive fallback if no data, otherwise use actual max
          maxValue: maxValue > 0 ? maxValue : 1,
        },
      }
    },
  })

  chart.priceScale('left').applyOptions({
    scaleMargins: {
      top: CHART_SCALE_MARGINS.TOP,
      bottom: CHART_SCALE_MARGINS.BOTTOM,
    },
    autoScale: true,
  })

  // DOM overlays
  container.style.position = 'relative'
  const labelsLayer = createLabelsLayer()
  const clearingPriceArrow = createClearingPriceArrow({ colors: createParams.colors })
  const bidLineDot = createBidLineDot({ colors: createParams.colors })
  const bidOutOfRangeIndicator = createBidOutOfRangeIndicator({
    colors: createParams.colors,
    labelText: createParams.bidOutOfRangeLabel,
  })

  container.appendChild(labelsLayer)
  container.appendChild(clearingPriceArrow)
  container.appendChild(bidLineDot)
  container.appendChild(bidOutOfRangeIndicator)

  bidOutOfRangeIndicator.addEventListener('click', onBidOutOfRangeIndicatorClick)

  // Subscriptions - Note: visible range subscriptions are deferred until after first setData
  // to avoid lightweight-charts internal errors when range changes fire with no data.
  chart.subscribeCrosshairMove(onCrosshairMove)
  chart.subscribeClick(onClick)
  window.addEventListener('resize', onResize)
  // Note: mouseleave detection is handled at the document level via the controller's
  // startTrackingMouseLeave/stopTrackingMouseLeave methods for reliability.

  // Deferred subscription setup - call this AFTER first setData to avoid internal errors
  const subscribeVisibleRangeChanges = () => {
    chart.timeScale().subscribeVisibleTimeRangeChange(onVisibleRangeChange)
    chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleRangeChange)
  }

  // Temporarily remove visible range listeners during data transitions to prevent
  // lightweight-charts internal crashes when _onVisibleBarsChanged fires getVisibleRange()
  // on stale logical range state.
  const unsubscribeVisibleRangeChanges = () => {
    chart.timeScale().unsubscribeVisibleTimeRangeChange(onVisibleRangeChange)
    chart.timeScale().unsubscribeVisibleLogicalRangeChange(onVisibleRangeChange)
  }

  const teardown = () => {
    window.removeEventListener('resize', onResize)
    // Note: document-level mouse tracking cleanup is handled by the controller
    chart.timeScale().unsubscribeVisibleTimeRangeChange(onVisibleRangeChange)
    chart.timeScale().unsubscribeVisibleLogicalRangeChange(onVisibleRangeChange)
    chart.unsubscribeCrosshairMove(onCrosshairMove)
    chart.unsubscribeClick(onClick)

    bidOutOfRangeIndicator.removeEventListener('click', onBidOutOfRangeIndicatorClick)

    // Remove DOM overlays
    if (container.contains(labelsLayer)) {
      container.removeChild(labelsLayer)
    }
    if (container.contains(clearingPriceArrow)) {
      container.removeChild(clearingPriceArrow)
    }
    if (container.contains(bidLineDot)) {
      container.removeChild(bidLineDot)
    }
    if (container.contains(bidOutOfRangeIndicator)) {
      container.removeChild(bidOutOfRangeIndicator)
    }
  }

  return {
    chart,
    series: customSeries,
    toucanChartSeries,
    elements: { labelsLayer, clearingPriceArrow, bidLineDot, bidOutOfRangeIndicator },
    teardown,
    subscribeVisibleRangeChanges,
    unsubscribeVisibleRangeChanges,
  }
}
