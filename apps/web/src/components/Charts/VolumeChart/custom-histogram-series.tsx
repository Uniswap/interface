/**
 * Copied from https://github.com/tradingview/lightweight-charts/blob/master/plugin-examples/src/plugins/stacked-bars-series/stacked-bars-series.ts
 * Renamed component/variable names from StackedBars to CustomHistogram since we generalized the series to handle both single and stacked histograms.
 */
import {
  CustomHistogramData,
  CustomHistogramProps,
  CustomHistogramSeriesOptions,
  CustomHistogramSeriesRenderer,
} from 'components/Charts/VolumeChart/renderer'
import { getCumulativeSum } from 'components/Charts/VolumeChart/utils'
import {
  CustomSeriesPricePlotValues,
  customSeriesDefaultOptions,
  ICustomSeriesPaneView,
  PaneRendererCustomData,
  Time,
  WhitespaceData,
} from 'lightweight-charts'

export class CustomHistogramSeries<TData extends CustomHistogramData>
  implements ICustomSeriesPaneView<Time, TData, CustomHistogramSeriesOptions>
{
  _renderer: CustomHistogramSeriesRenderer<TData>
  _colors: string[]
  _background?: string

  constructor(props: CustomHistogramProps) {
    this._renderer = new CustomHistogramSeriesRenderer(props)
    this._colors = props.colors
    this._background = props.background
  }

  priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
    return [0, getCumulativeSum(plotRow)]
  }

  isWhitespace(data: TData | WhitespaceData): data is WhitespaceData {
    return !(data as Partial<TData>).time || !getCumulativeSum(data as TData)
  }

  renderer(): CustomHistogramSeriesRenderer<TData> {
    return this._renderer
  }

  update(data: PaneRendererCustomData<Time, TData>, options: CustomHistogramSeriesOptions): void {
    this._renderer.update(data, options)
  }

  defaultOptions() {
    return {
      ...customSeriesDefaultOptions,
      colors: this._colors,
    }
  }
}
