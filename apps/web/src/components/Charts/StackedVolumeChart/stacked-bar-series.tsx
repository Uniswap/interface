/* Copied from https://github.com/tradingview/lightweight-charts/blob/master/plugin-examples/src/plugins/stacked-bars-series/stacked-bars-series.ts */
import {
  customSeriesDefaultOptions,
  CustomSeriesPricePlotValues,
  ICustomSeriesPaneView,
  PaneRendererCustomData,
  Time,
  WhitespaceData,
} from 'lightweight-charts'

import { StackedBarsData, StackedBarsProps, StackedBarsSeriesOptions, StackedBarsSeriesRenderer } from './renderer'

export function getCumulativeSum(data: StackedBarsData): number {
  return (data.values?.v2 || 0) + (data.values?.v3 || 0)
}

export class StackedBarsSeries<TData extends StackedBarsData>
  implements ICustomSeriesPaneView<Time, TData, StackedBarsSeriesOptions>
{
  _renderer: StackedBarsSeriesRenderer<TData>
  _colors: [string, string]

  constructor(props: StackedBarsProps) {
    this._renderer = new StackedBarsSeriesRenderer(props)
    this._colors = props.colors
  }

  priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
    return [0, getCumulativeSum(plotRow)]
  }

  isWhitespace(data: TData | WhitespaceData): data is WhitespaceData {
    return !(data as Partial<TData>).values || !getCumulativeSum(data as TData)
  }

  renderer(): StackedBarsSeriesRenderer<TData> {
    return this._renderer
  }

  update(data: PaneRendererCustomData<Time, TData>, options: StackedBarsSeriesOptions): void {
    this._renderer.update(data, options)
  }

  defaultOptions() {
    return {
      ...customSeriesDefaultOptions,
      colors: this._colors,
    }
  }
}
