import { ChartModel, ChartModelParams } from 'components/Charts/ChartModel'
import { BarPrice, ISeriesApi } from 'lightweight-charts'
import { NumberType } from 'utils/formatNumbers'

import { CrosshairHighlightPrimitive } from './CrosshairHighlightPrimitive'
import { CustomHistogramSeries } from './custom-histogram-series'
import { CustomHistogramData } from './renderer'

export type CustomVolumeChartModelParams = {
  colors: string[]
  headerHeight: number
}

// Custom volume chart model, uses stacked volume chart as base model
// Extensible to other volume charts (i.e. see VolumeChartModel for single-histogram volume chart implementation)
export class CustomVolumeChartModel<TDataType extends CustomHistogramData> extends ChartModel<TDataType> {
  protected series: ISeriesApi<'Custom'>
  private highlightBarPrimitive: CrosshairHighlightPrimitive

  constructor(chartDiv: HTMLDivElement, params: ChartModelParams<TDataType> & CustomVolumeChartModelParams) {
    super(chartDiv, params)

    this.series = this.api.addCustomSeries(new CustomHistogramSeries({ colors: params.colors }))

    this.series.setData(this.data)

    // Add crosshair highlight bar
    this.highlightBarPrimitive = new CrosshairHighlightPrimitive({
      color: params.theme.surface3,
      crosshairYPosition: params.headerHeight,
    })
    this.series.attachPrimitive(this.highlightBarPrimitive)

    this.updateOptions(params)
    this.fitContent()
  }

  updateOptions(params: ChartModelParams<TDataType> & CustomVolumeChartModelParams, options?: any) {
    // Use stacked volume chart set-up options as default base options
    const stackedVolumeChartOptions = {
      localization: {
        locale: params.locale,
        priceFormatter: (price: BarPrice) =>
          params.format.formatFiatPrice({ price, type: NumberType.ChartVolumePriceScale }),
      },
      rightPriceScale: {
        visible: false,
      },
      handleScale: false,
      handleScroll: false,
      crosshair: {
        horzLine: {
          visible: false,
          labelVisible: false,
        },
        vertLine: {
          visible: false,
          labelVisible: false,
        },
      },
      ...options,
    }

    super.updateOptions(params, stackedVolumeChartOptions)
    const { data } = params

    // Handles changes in data, e.g. time period selection
    if (this.data !== data) {
      this.data = data
      this.series.setData(data)
      this.fitContent()
    }

    this.series.applyOptions({
      priceFormat: {
        type: 'volume',
      },
      priceLineVisible: false,
      lastValueVisible: false,
    })

    this.series.priceScale().applyOptions({
      scaleMargins: {
        top: 0.3,
        bottom: 0,
      },
    })
  }
}
