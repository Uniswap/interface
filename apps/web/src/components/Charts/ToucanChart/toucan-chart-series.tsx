import {
  ToucanChartData,
  ToucanChartProps,
  ToucanChartSeriesOptions,
  ToucanChartSeriesRenderer,
} from 'components/Charts/ToucanChart/renderer'
import {
  CustomSeriesPricePlotValues,
  customSeriesDefaultOptions,
  ICustomSeriesPaneView,
  PaneRendererCustomData,
  Time,
  WhitespaceData,
} from 'lightweight-charts'

/**
 * Custom chart series for Toucan bid distribution chart
 * Based on lightweight-charts histogram series, adapted for bid distribution display
 */

export class ToucanChartSeries implements ICustomSeriesPaneView<Time, ToucanChartData, ToucanChartSeriesOptions> {
  _renderer: ToucanChartSeriesRenderer
  _barColors: ToucanChartProps['barColors']
  _labelColors: ToucanChartProps['labelColors']
  _labelStyles: ToucanChartProps['labelStyles']

  constructor(props: ToucanChartProps) {
    this._renderer = new ToucanChartSeriesRenderer(props)
    this._barColors = props.barColors
    this._labelColors = props.labelColors
    this._labelStyles = props.labelStyles
  }

  priceValueBuilder(plotRow: ToucanChartData): CustomSeriesPricePlotValues {
    return [0, plotRow.value]
  }

  isWhitespace(data: ToucanChartData | WhitespaceData): data is WhitespaceData {
    return !('value' in data)
  }

  renderer(): ToucanChartSeriesRenderer {
    return this._renderer
  }

  update(data: PaneRendererCustomData<Time, ToucanChartData>, options: ToucanChartSeriesOptions): void {
    this._renderer.update(data, options)
  }

  defaultOptions(): ToucanChartSeriesOptions {
    return {
      ...customSeriesDefaultOptions,
      barColors: this._barColors,
    }
  }
}
