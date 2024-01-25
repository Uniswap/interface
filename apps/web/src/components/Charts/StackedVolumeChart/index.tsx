import { ChartHeaderProtocolInfo } from 'components/Charts/ChartHeader'
import { ChartModel, ChartModelParams } from 'components/Charts/ChartModel'
import { PriceSource } from 'graphql/data/__generated__/types-and-hooks'
import { ISeriesApi } from 'lightweight-charts'

import { CrosshairHighlightPrimitive } from '../VolumeChart/CrosshairHighlightPrimitive'
import { StackedBarsData } from './renderer'
import { getCumulativeSum, StackedBarsSeries } from './stacked-bar-series'

type StackedVolumeChartModelParams = ChartModelParams<StackedBarsData> & { colors: [string, string] }

export class StackedVolumeChartModel extends ChartModel<StackedBarsData> {
  protected series: ISeriesApi<'Custom'>
  private highlightBarPrimitive: CrosshairHighlightPrimitive

  constructor(chartDiv: HTMLDivElement, params: StackedVolumeChartModelParams) {
    super(chartDiv, params)

    this.series = this.api.addCustomSeries(new StackedBarsSeries({ colors: params.colors }))

    this.series.setData(this.data)

    // Add crosshair highlight bar
    this.highlightBarPrimitive = new CrosshairHighlightPrimitive({
      color: params.theme.surface3,
      crosshairYPosition: 85,
    })
    this.series.attachPrimitive(this.highlightBarPrimitive)

    this.updateOptions(params)
    this.fitContent()
  }

  updateOptions(params: StackedVolumeChartModelParams) {
    const stackedVolumeChartOptions = {
      localization: {
        locale: params.locale,
      },
      rightPriceScale: {
        visible: false,
      },
      handleScale: {
        axisPressedMouseMove: false,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: false,
        },
      },
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
    }

    super.updateOptions(params, stackedVolumeChartOptions)
    const { data, theme } = params

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

    this.highlightBarPrimitive.applyOptions({ color: theme.surface3 })
  }
}

export function getVolumeProtocolInfo(
  data: StackedBarsData | undefined,
  sources: PriceSource[]
): ChartHeaderProtocolInfo[] {
  const info = new Array<ChartHeaderProtocolInfo>()
  for (const source of sources) {
    switch (source) {
      case PriceSource.SubgraphV2:
        info.push({ protocol: source, value: data?.values.v2 })
        break
      case PriceSource.SubgraphV3:
        info.push({ protocol: source, value: data?.values.v3 })
        break
    }
  }
  return info
}

export function getCumulativeVolume(data: StackedBarsData[]) {
  return data.reduce((sum, curr) => (sum += getCumulativeSum(curr)), 0)
}
