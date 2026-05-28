import type { AutoscaleInfo, IChartApi, ISeriesApi, MouseEventParams, Time } from 'lightweight-charts'
import { createChart } from 'lightweight-charts'
import { CHART_SCALE_MARGINS } from '~/features/Toucan/Auction/BidDistributionChart/constants'
import { createToucanBidDistributionChartOptions } from '~/features/Toucan/ToucanChart/bidDistribution/controller/chartOptions'
import { createBidLineDot } from '~/features/Toucan/ToucanChart/bidDistribution/controller/overlays/bidLineDot'
import { createBidOutOfRangeIndicator } from '~/features/Toucan/ToucanChart/bidDistribution/controller/overlays/bidOutOfRangeIndicator'
import { createClearingPriceArrow } from '~/features/Toucan/ToucanChart/bidDistribution/controller/overlays/clearingPriceArrow'
import { createLabelsLayer } from '~/features/Toucan/ToucanChart/bidDistribution/controller/overlays/labelsLayer'
import type { ToucanBidDistributionChartControllerCreateParams } from '~/features/Toucan/ToucanChart/bidDistribution/types'
import { ToucanChartSeries } from '~/features/Toucan/ToucanChart/toucan-chart-series'

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
  setGlobalMaxValue: (value: number) => void
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

  const isDemandMode = createParams.chartMode === 'demand'

  // For demand mode, we keep the y-axis range pinned to the global max across ALL bars so that
  // bar heights never change when the user pans left/right (lightweight-charts would otherwise
  // auto-scale to only the currently visible bars).
  const globalMaxRef = { value: 1 }
  const setGlobalMaxValue = (value: number): void => {
    globalMaxRef.value = value
  }

  const chart = createChart(
    container,
    createToucanBidDistributionChartOptions({
      width: container.clientWidth,
      height: createParams.height,
      colors: createParams.colors,
      priceFormatter: (price: number) => createParams.formatYAxisLabel(price),
      showYAxis: !isDemandMode,
      isDemandMode,
    }),
  )

  const toucanChartSeries = new ToucanChartSeries()
  const customSeries = chart.addCustomSeries(toucanChartSeries, {
    priceScaleId: 'left',
    priceLineVisible: false,
    lastValueVisible: false,
    autoscaleInfoProvider: isDemandMode
      ? (_: () => AutoscaleInfo | null) => ({
          priceRange: {
            minValue: 0,
            maxValue: globalMaxRef.value > 0 ? globalMaxRef.value : 1,
          },
        })
      : (baseImpl: () => AutoscaleInfo | null) => {
          const result = baseImpl()
          const maxValue = result ? result.priceRange.maxValue : 0
          return {
            priceRange: {
              minValue: 0,
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
    setGlobalMaxValue,
  }
}
