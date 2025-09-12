/* Copied from: https://github.com/tradingview/lightweight-charts/blob/f13a3c1f3fefcace9d4da5b97c1638009298b3c8/plugin-examples/src/plugins/stacked-area-series */
import { StackedAreaData } from 'components/Charts/StackedLineChart/stacked-area-series/data'
import {
  defaultOptions,
  StackedAreaSeriesOptions,
} from 'components/Charts/StackedLineChart/stacked-area-series/options'
import { StackedAreaSeriesRenderer } from 'components/Charts/StackedLineChart/stacked-area-series/renderer'
import {
  CustomSeriesPricePlotValues,
  ICustomSeriesPaneView,
  PaneRendererCustomData,
  Time,
  WhitespaceData,
} from 'lightweight-charts'

export class StackedAreaSeries<TData extends StackedAreaData>
  implements ICustomSeriesPaneView<Time, TData, StackedAreaSeriesOptions>
{
  _renderer: StackedAreaSeriesRenderer<TData>

  constructor() {
    this._renderer = new StackedAreaSeriesRenderer()
  }

  priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
    return [0, plotRow.values.reduce((previousValue, currentValue) => previousValue + currentValue, 0)]
  }

  isWhitespace(data: TData | WhitespaceData): data is WhitespaceData {
    return !(data as Partial<TData>).values?.length
  }

  renderer(): StackedAreaSeriesRenderer<TData> {
    return this._renderer
  }

  update(data: PaneRendererCustomData<Time, TData>, options: StackedAreaSeriesOptions): void {
    this._renderer.update(data, options)
  }

  defaultOptions() {
    return defaultOptions
  }
}
