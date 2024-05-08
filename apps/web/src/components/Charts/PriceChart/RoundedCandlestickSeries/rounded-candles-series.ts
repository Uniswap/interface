/**
 * Copied from https://github.com/tradingview/lightweight-charts/blob/master/plugin-examples/src/plugins/rounded-candle-series/rounded-candle-series.ts
 */
import {
  CandlestickData,
  CandlestickSeriesOptions,
  CustomSeriesOptions,
  CustomSeriesPricePlotValues,
  ICustomSeriesPaneView,
  PaneRendererCustomData,
  Time,
  UTCTimestamp,
  WhitespaceData,
  customSeriesDefaultOptions,
} from 'lightweight-charts'
import { RoundedCandleSeriesRenderer } from './renderer'

export interface RoundedCandleSeriesOptions
  extends CustomSeriesOptions,
    Exclude<CandlestickSeriesOptions, 'borderVisible' | 'borderColor' | 'borderUpColor' | 'borderDownColor'> {
  radius: (barSpacing: number) => number
  neutralColor: string
}

const defaultOptions: RoundedCandleSeriesOptions = {
  ...customSeriesDefaultOptions,
  upColor: '#26a69a',
  downColor: '#ef5350',
  neutralColor: '#26a69a',
  wickVisible: true,
  borderVisible: true,
  borderColor: '#378658',
  borderUpColor: '#26a69a',
  borderDownColor: '#ef5350',
  wickColor: '#737375',
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350',
  radius(bs: number) {
    if (bs < 4) return 0
    return bs / 3
  },
} as const

export class RoundedCandleSeries<TData extends CandlestickData<UTCTimestamp>>
  implements ICustomSeriesPaneView<Time, TData, RoundedCandleSeriesOptions>
{
  _renderer: RoundedCandleSeriesRenderer<TData>

  constructor() {
    this._renderer = new RoundedCandleSeriesRenderer()
  }

  priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
    return [plotRow.high, plotRow.low, plotRow.close]
  }

  renderer(): RoundedCandleSeriesRenderer<TData> {
    return this._renderer
  }

  isWhitespace(data: TData | WhitespaceData): data is WhitespaceData {
    return (data as Partial<TData>).close === undefined
  }

  update(data: PaneRendererCustomData<Time, TData>, options: RoundedCandleSeriesOptions): void {
    this._renderer.update(data, options)
  }

  defaultOptions() {
    return defaultOptions
  }
}
