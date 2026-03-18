import {
  CustomSeriesPricePlotValues,
  customSeriesDefaultOptions,
  ICustomSeriesPaneView,
  PaneRendererCustomData,
  Time,
  WhitespaceData,
} from 'lightweight-charts'
import {
  ToucanChartData,
  ToucanChartProps,
  ToucanChartSeriesOptions,
  ToucanChartSeriesRenderer,
} from '~/components/Charts/ToucanChart/renderer'

/**
 * Custom chart series for Toucan bid distribution chart
 * Based on lightweight-charts histogram series, adapted for bid distribution display
 */

export class ToucanChartSeries implements ICustomSeriesPaneView<Time, ToucanChartData, ToucanChartSeriesOptions> {
  _renderer: ToucanChartSeriesRenderer

  constructor(props?: ToucanChartProps) {
    // The renderer is now controller-driven via `series.applyOptions(...)`.
    // We still accept props for backwards compatibility, but a controller can omit them and
    // provide full configuration in the first `applyOptions` call before/alongside data updates.
    this._renderer = new ToucanChartSeriesRenderer(
      props ?? {
        barColors: {
          clearingPriceColor: 'transparent',
          concentrationColor: 'transparent',
          aboveClearingPriceColor: 'transparent',
          belowClearingPriceColor: 'transparent',
        },
        labelColors: {
          background: 'transparent',
          border: 'transparent',
          text: 'transparent',
          subtitle: 'transparent',
        },
        labelStyles: { fontFamily: '' },
        clearingPriceLineColors: { gradientStart: 'transparent', gradientEnd: 'transparent' },
        bidLineColors: undefined,
        clearingPrice: 0,
        tickSize: 0,
        priceScaleFactor: 1,
        // IMPORTANT: lightweight-charts deep-merges options. Using `null` here can crash later when we
        // apply an object (it tries to set `startIndex` on `null`). Keep an object always.
        concentrationBand: { startIndex: 0, endIndex: 0, startTick: Number.NaN, endTick: Number.NaN },
        userBidPrice: null,
      },
    )
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

  /**
   * Returns the last calculated clearing price X position in media (CSS) coordinates.
   * This position is computed by the renderer during the draw cycle and is used to
   * synchronize DOM overlays (like the triangle indicator) with the canvas-rendered line.
   */
  getClearingPriceXPosition(): number | null {
    return this._renderer._lastClearingPriceXMedia
  }

  /**
   * Returns the last calculated bid line X position in media (CSS) coordinates.
   * This position is computed by the renderer during the draw cycle and is used to
   * synchronize DOM overlays (like the bid dot) with the canvas-rendered line.
   */
  getBidLineXPosition(): number | null {
    return this._renderer._lastBidLineXMedia
  }

  defaultOptions(): ToucanChartSeriesOptions {
    return {
      ...customSeriesDefaultOptions,
      barColors: {
        clearingPriceColor: 'transparent',
        concentrationColor: 'transparent',
        aboveClearingPriceColor: 'transparent',
        belowClearingPriceColor: 'transparent',
      },
      labelColors: {
        background: 'transparent',
        border: 'transparent',
        text: 'transparent',
        subtitle: 'transparent',
      },
      labelStyles: { fontFamily: '' },
      clearingPriceLineColors: { gradientStart: 'transparent', gradientEnd: 'transparent' },
      bidLineColors: undefined,
      clearingPrice: 0,
      tickSize: 0,
      priceScaleFactor: 1,
      // IMPORTANT: lightweight-charts deep-merges options; `null` causes crashes when later merging an object.
      concentrationBand: { startIndex: 0, endIndex: 0, startTick: Number.NaN, endTick: Number.NaN },
      hoveredTickValue: null,
      isHoveringClearingPrice: false,
      userBidPrice: null,
    }
  }
}
