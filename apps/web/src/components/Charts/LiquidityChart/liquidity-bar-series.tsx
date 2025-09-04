import { LiquidityBarSeriesRenderer } from 'components/Charts/LiquidityChart/renderer'
import { LiquidityBarData, LiquidityBarProps, LiquidityBarSeriesOptions } from 'components/Charts/LiquidityChart/types'
import {
  CustomSeriesPricePlotValues,
  customSeriesDefaultOptions,
  ICustomSeriesPaneView,
  PaneRendererCustomData,
  Time,
  WhitespaceData,
} from 'lightweight-charts'

export class LiquidityBarSeries<TData extends LiquidityBarData>
  implements ICustomSeriesPaneView<Time, TData, LiquidityBarSeriesOptions>
{
  _renderer: LiquidityBarSeriesRenderer<TData>
  _tokenAColor: string
  _tokenBColor: string
  _highlightColor: string

  constructor(props: LiquidityBarProps) {
    this._tokenAColor = props.tokenAColor
    this._renderer = new LiquidityBarSeriesRenderer(props)
    this._tokenBColor = props.tokenBColor
    this._highlightColor = props.highlightColor
  }

  priceValueBuilder(plotRow: TData): CustomSeriesPricePlotValues {
    return [0, plotRow.liquidity]
  }

  isWhitespace(data: TData | WhitespaceData): data is WhitespaceData {
    return !(data as TData).liquidity
  }

  renderer(): LiquidityBarSeriesRenderer<TData> {
    return this._renderer
  }

  update(data: PaneRendererCustomData<Time, TData>, options: LiquidityBarSeriesOptions): void {
    this._renderer.update(data, options)
  }

  defaultOptions() {
    return {
      ...customSeriesDefaultOptions,
      tokenAColor: this._tokenAColor,
      tokenBColor: this._tokenBColor,
      highlightColor: this._highlightColor,
    }
  }
}
