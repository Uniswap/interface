/**
 * Copied from https://github.com/tradingview/lightweight-charts/blob/master/plugin-examples/src/plugins/highlight-bar-crosshair/highlight-bar-crosshair.ts.
 * Modifications are called out with comments.
 */
import { roundRect } from 'components/Charts/utils'
import { CanvasRenderingTarget2D } from 'fancy-canvas'
import {
  CrosshairMode,
  ISeriesPrimitive,
  ISeriesPrimitivePaneRenderer,
  ISeriesPrimitivePaneView,
  MouseEventParams,
  SeriesAttachedParameter,
  Time,
} from 'lightweight-charts'

interface BitmapPositionLength {
  /** coordinate for use with a bitmap rendering scope */
  position: number
  /** length for use with a bitmap rendering scope */
  length: number
}

function centreOffset(lineBitmapWidth: number): number {
  return Math.floor(lineBitmapWidth * 0.5)
}

/**
 * Calculates the bitmap position for an item with a desired length (height or width), and centred according to
 * an position coordinate defined in media sizing.
 * @param positionMedia - position coordinate for the bar (in media coordinates)
 * @param pixelRatio - pixel ratio. Either horizontal for x positions, or vertical for y positions
 * @param desiredWidthMedia - desired width (in media coordinates)
 * @returns Position of of the start point and length dimension.
 */
export function positionsLine({
  positionMedia,
  pixelRatio,
  desiredWidthMedia = 1,
  widthIsBitmap = false,
}: {
  positionMedia: number
  pixelRatio: number
  desiredWidthMedia?: number
  widthIsBitmap?: boolean
}): BitmapPositionLength {
  const scaledPosition = Math.round(pixelRatio * positionMedia)
  const lineBitmapWidth = widthIsBitmap ? desiredWidthMedia : Math.round(desiredWidthMedia * pixelRatio)
  const offset = centreOffset(lineBitmapWidth)
  const position = scaledPosition - offset
  return { position, length: lineBitmapWidth }
}

interface CrosshairHighlightData {
  x: number
  visible: boolean
  barSpacing: number
}

interface HighlightBarCrosshairOptions {
  color: string
  crosshairYPosition: number
  useThinCrosshair?: boolean
}

class CrosshairHighlightPaneRenderer implements ISeriesPrimitivePaneRenderer {
  _data: CrosshairHighlightData & HighlightBarCrosshairOptions

  constructor(data: CrosshairHighlightData & HighlightBarCrosshairOptions) {
    this._data = data
  }

  draw(target: CanvasRenderingTarget2D) {
    if (!this._data.visible) {
      return
    }
    // biome-ignore lint/correctness/useHookAtTopLevel: this is not a hook
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context
      const crosshairPos = positionsLine({
        positionMedia: this._data.x,
        pixelRatio: scope.horizontalPixelRatio,
        desiredWidthMedia: Math.max(1, this._data.barSpacing),
      })
      ctx.fillStyle = this._data.color
      const crosshairYPosition = this._data.crosshairYPosition * scope.verticalPixelRatio

      // Modification: increase space between bars
      const margin =
        Math.min(
          Math.max(scope.horizontalPixelRatio, crosshairPos.length),
          this._data.barSpacing * scope.horizontalPixelRatio,
        ) * 0.035
      const crosshairXPosition = crosshairPos.position + margin

      // Modification: use centered 2px wide line to top
      if (this._data.useThinCrosshair) {
        ctx.fillRect(
          crosshairXPosition + crosshairPos.length / 2,
          crosshairYPosition,
          2,
          scope.bitmapSize.height - crosshairYPosition,
        )
      } else {
        roundRect({
          ctx,
          x: crosshairXPosition,
          y: crosshairYPosition,
          w: crosshairPos.length,
          h: scope.bitmapSize.height - crosshairYPosition,
          radii: 9,
        })
      }

      // Modification: lower opacity of all content outside the highlight bar
      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = 0.76 // results in existing items being left with 0.24 opacity
      ctx.fillStyle = 'black'

      // lower opacity to left of highlight bar
      ctx.fillRect(0, crosshairYPosition, crosshairXPosition, scope.bitmapSize.height - crosshairYPosition)
      // lower opacity to right of highlight bar
      ctx.fillRect(
        crosshairXPosition + crosshairPos.length,
        crosshairYPosition,
        scope.bitmapSize.width - (crosshairXPosition + crosshairPos.length),
        scope.bitmapSize.height - crosshairYPosition,
      )
      // reset global settings
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    })
  }
}

class CrosshairHighlightPaneView implements ISeriesPrimitivePaneView {
  _data: CrosshairHighlightData
  _options: HighlightBarCrosshairOptions
  constructor(data: CrosshairHighlightData, options: HighlightBarCrosshairOptions) {
    this._data = data
    this._options = options
  }

  update(data: CrosshairHighlightData, options: HighlightBarCrosshairOptions): void {
    this._data = data
    this._options = options
  }

  renderer(): ISeriesPrimitivePaneRenderer | null {
    return new CrosshairHighlightPaneRenderer({ ...this._data, ...this._options })
  }
}

export class CrosshairHighlightPrimitive implements ISeriesPrimitive<Time> {
  _options: HighlightBarCrosshairOptions
  _paneViews: CrosshairHighlightPaneView[]
  _data: CrosshairHighlightData = {
    x: 0,
    visible: false,
    barSpacing: 6,
  }
  _attachedParams: SeriesAttachedParameter<Time> | undefined

  constructor(options: HighlightBarCrosshairOptions) {
    this._options = {
      ...options,
    }
    this._paneViews = [new CrosshairHighlightPaneView(this._data, this._options)]
  }

  attached(param: SeriesAttachedParameter<Time>): void {
    this._attachedParams = param
    this._setCrosshairMode()
    param.chart.subscribeCrosshairMove(this._moveHandler)
  }

  detached(): void {
    const chart = this.chart()
    if (chart) {
      chart.unsubscribeCrosshairMove(this._moveHandler)
    }
  }

  paneViews() {
    return this._paneViews
  }

  updateAllViews() {
    this._paneViews.forEach((pw) => pw.update(this._data, this._options))
  }

  setData(data: CrosshairHighlightData) {
    this._data = data

    this._attachedParams?.requestUpdate()
    this.updateAllViews()
  }

  public applyOptions(options: Partial<HighlightBarCrosshairOptions>): void {
    this._options = {
      ...this._options,
      ...options,
    }
    this.updateAllViews()
  }

  chart() {
    return this._attachedParams?.chart
  }

  // We need to disable magnet mode for this to work nicely
  _setCrosshairMode() {
    const chart = this.chart()
    if (!chart) {
      throw new Error('Unable to change crosshair mode because the chart instance is undefined')
    }
    chart.applyOptions({
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          visible: false,
          labelVisible: false,
        },
      },
    })
  }

  private _moveHandler = (param: MouseEventParams) => this._onMouseMove(param)

  private _barSpacing(): number {
    const chart = this.chart()
    if (!chart) {
      return 6
    }
    const ts = chart.timeScale()
    const visibleLogicalRange = ts.getVisibleLogicalRange()
    if (!visibleLogicalRange) {
      return 6
    }
    return ts.width() / (visibleLogicalRange.to + 1 - visibleLogicalRange.from)
  }

  private _onMouseMove(param: MouseEventParams) {
    const chart = this.chart()
    const logical = param.logical
    if (logical === undefined || !chart) {
      this.setData({
        x: 0,
        visible: false,
        barSpacing: this._barSpacing(),
      })
      return
    }
    const coordinate = chart.timeScale().logicalToCoordinate(logical)
    this.setData({
      x: coordinate ?? 0,
      visible: coordinate !== null,
      barSpacing: this._barSpacing(),
    })
  }
}
