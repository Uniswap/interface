/**
 * Copied from https://github.com/tradingview/lightweight-charts/blob/master/plugin-examples/src/plugins/rounded-candle-series/renderer.ts
 */
import { positionsLine } from 'components/Charts/VolumeChart/CrosshairHighlightPrimitive'
import { positionsBox } from 'components/Charts/VolumeChart/utils'
import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from 'fancy-canvas'
import {
  CandlestickData,
  ICustomSeriesPaneRenderer,
  PaneRendererCustomData,
  PriceToCoordinateConverter,
  Range,
  Time,
  UTCTimestamp,
} from 'lightweight-charts'
import { RoundedCandleSeriesOptions } from './rounded-candles-series'

interface BarItem {
  openY: number
  highY: number
  lowY: number
  closeY: number
  x: number
  isUp: boolean
}

export class RoundedCandleSeriesRenderer<TData extends CandlestickData<UTCTimestamp>>
  implements ICustomSeriesPaneRenderer
{
  _data: PaneRendererCustomData<Time, TData> | null = null
  _options: RoundedCandleSeriesOptions | null = null

  draw(target: CanvasRenderingTarget2D, priceConverter: PriceToCoordinateConverter): void {
    target.useBitmapCoordinateSpace((scope) => this._drawImpl(scope, priceConverter))
  }

  update(data: PaneRendererCustomData<Time, TData>, options: RoundedCandleSeriesOptions): void {
    this._data = data
    this._options = options
  }

  _drawImpl(renderingScope: BitmapCoordinatesRenderingScope, priceToCoordinate: PriceToCoordinateConverter): void {
    if (
      this._data === null ||
      this._data.bars.length === 0 ||
      this._data.visibleRange === null ||
      this._options === null
    ) {
      return
    }

    let lastClose = -Infinity
    const bars: BarItem[] = this._data.bars.map((bar) => {
      const isUp = bar.originalData.close >= lastClose
      lastClose = bar.originalData.close ?? lastClose
      const openY = priceToCoordinate(bar.originalData.open as number) ?? 0
      const highY = priceToCoordinate(bar.originalData.high as number) ?? 0
      const lowY = priceToCoordinate(bar.originalData.low as number) ?? 0
      const closeY = priceToCoordinate(bar.originalData.close as number) ?? 0
      return {
        openY,
        highY,
        lowY,
        closeY,
        x: bar.x,
        isUp,
      }
    })

    const radius = this._options.radius(this._data.barSpacing)
    this._drawWicks(renderingScope, bars, this._data.visibleRange)
    this._drawCandles(renderingScope, bars, this._data.visibleRange, radius)
  }

  private _drawWicks(
    renderingScope: BitmapCoordinatesRenderingScope,
    bars: readonly BarItem[],
    visibleRange: Range<number>
  ): void {
    if (this._data === null || this._options === null) {
      return
    }

    const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = renderingScope

    const wickWidth = gridAndCrosshairMediaWidth(horizontalPixelRatio)

    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const bar = bars[i]
      ctx.fillStyle = bar.isUp ? this._options.wickUpColor : this._options.wickDownColor

      const verticalPositions = positionsBox(bar.lowY, bar.highY, verticalPixelRatio)
      const linePositions = positionsLine(bar.x, horizontalPixelRatio, wickWidth)
      ctx.fillRect(linePositions.position, verticalPositions.position, linePositions.length, verticalPositions.length)
    }
  }

  private _drawCandles(
    renderingScope: BitmapCoordinatesRenderingScope,
    bars: readonly BarItem[],
    visibleRange: Range<number>,
    radius: number
  ): void {
    if (this._data === null || this._options === null) {
      return
    }

    const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = renderingScope

    // we want this in media width therefore using 1
    // positionsLine will adjust for pixelRatio
    const candleBodyWidth = candlestickWidth(this._data.barSpacing, 1)

    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const bar = bars[i]

      const verticalPositions = positionsBox(
        Math.min(bar.openY, bar.closeY),
        Math.max(bar.openY, bar.closeY),
        verticalPixelRatio
      )
      const linePositions = positionsLine(bar.x, horizontalPixelRatio, candleBodyWidth)

      ctx.fillStyle = bar.isUp ? this._options.upColor : this._options.downColor

      // roundRect might need to polyfilled for older browsers
      if (ctx.roundRect) {
        ctx.beginPath()
        ctx.roundRect(
          linePositions.position,
          verticalPositions.position,
          linePositions.length,
          Math.max(verticalPositions.length, 1),
          radius
        )
        ctx.fill()
      } else {
        ctx.fillRect(linePositions.position, verticalPositions.position, linePositions.length, verticalPositions.length)
      }
    }
  }
}

function optimalCandlestickWidth(barSpacing: number, pixelRatio: number): number {
  const barSpacingSpecialCaseFrom = 2.5
  const barSpacingSpecialCaseTo = 4
  const barSpacingSpecialCaseCoeff = 3
  if (barSpacing >= barSpacingSpecialCaseFrom && barSpacing <= barSpacingSpecialCaseTo) {
    return Math.floor(barSpacingSpecialCaseCoeff * pixelRatio)
  }
  // coeff should be 1 on small barspacing and go to 0.8 while groing bar spacing
  const barSpacingReducingCoeff = 0.2
  const coeff =
    1 -
    (barSpacingReducingCoeff * Math.atan(Math.max(barSpacingSpecialCaseTo, barSpacing) - barSpacingSpecialCaseTo)) /
      (Math.PI * 0.5)
  const res = Math.floor(barSpacing * coeff * pixelRatio)
  const scaledBarSpacing = Math.floor(barSpacing * pixelRatio)
  const optimal = Math.min(res, scaledBarSpacing)
  return Math.max(Math.floor(pixelRatio), optimal)
}

/**
 * Calculates the candlestick width that the library would use for the current
 * bar spacing.
 * @param barSpacing bar spacing in media coordinates
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @returns The width (in bitmap coordinates) that the chart would use to draw a candle body
 */
function candlestickWidth(barSpacing: number, horizontalPixelRatio: number): number {
  let width = optimalCandlestickWidth(barSpacing, horizontalPixelRatio)
  if (width >= 2) {
    const wickWidth = Math.floor(horizontalPixelRatio)
    if (wickWidth % 2 !== width % 2) {
      width--
    }
  }
  return width
}

/**
 * Default grid / crosshair line width in Bitmap sizing
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @returns default grid / crosshair line width in Bitmap sizing
 */
function gridAndCrosshairBitmapWidth(horizontalPixelRatio: number): number {
  return Math.max(1, Math.floor(horizontalPixelRatio))
}

/**
 * Default grid / crosshair line width in Media sizing
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @returns default grid / crosshair line width in Media sizing
 */
function gridAndCrosshairMediaWidth(horizontalPixelRatio: number): number {
  return gridAndCrosshairBitmapWidth(horizontalPixelRatio) / horizontalPixelRatio
}
