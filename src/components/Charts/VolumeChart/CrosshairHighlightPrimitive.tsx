/**
 * Copied from https://github.com/tradingview/lightweight-charts/blob/master/plugin-examples/src/plugins/highlight-bar-crosshair/highlight-bar-crosshair.ts.
 */
import { CanvasRenderingTarget2D } from 'fancy-canvas'
import {
  CrosshairMode,
  ISeriesPrimitive,
  ISeriesPrimitivePaneRenderer,
  ISeriesPrimitivePaneView,
  MouseEventParams,
  SeriesAttachedParameter,
  SeriesPrimitivePaneViewZOrder,
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
function positionsLine(
  positionMedia: number,
  pixelRatio: number,
  desiredWidthMedia = 1,
  widthIsBitmap?: boolean
): BitmapPositionLength {
  const scaledPosition = Math.round(pixelRatio * positionMedia)
  const lineBitmapWidth = widthIsBitmap ? desiredWidthMedia : Math.round(desiredWidthMedia * pixelRatio)
  const offset = centreOffset(lineBitmapWidth)
  const position = scaledPosition - offset
  return { position, length: lineBitmapWidth }
}

class CrosshairHighlightPaneRenderer implements ISeriesPrimitivePaneRenderer {
  _data: CrosshairHighlightData

  constructor(data: CrosshairHighlightData) {
    this._data = data
  }

  draw(target: CanvasRenderingTarget2D) {
    if (!this._data.visible) return
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context
      const crosshairPos = positionsLine(this._data.x, scope.horizontalPixelRatio, Math.max(1, this._data.barSpacing))
      ctx.fillStyle = this._data.color
      ctx.fillRect(crosshairPos.position, 175, crosshairPos.length, scope.bitmapSize.height)
    })
  }
}

class CrosshairHighlightPaneView implements ISeriesPrimitivePaneView {
  _data: CrosshairHighlightData
  constructor(data: CrosshairHighlightData) {
    this._data = data
  }

  update(data: CrosshairHighlightData): void {
    this._data = data
  }

  renderer(): ISeriesPrimitivePaneRenderer | null {
    return new CrosshairHighlightPaneRenderer(this._data)
  }

  zOrder(): SeriesPrimitivePaneViewZOrder {
    return 'bottom'
  }
}

interface CrosshairHighlightData {
  x: number
  visible: boolean
  color: string
  barSpacing: number
}

const defaultOptions: HighlightBarCrosshairOptions = {
  color: 'rgba(0, 0, 0, 0.2)',
}

interface HighlightBarCrosshairOptions {
  color: string
}

export class CrosshairHighlightPrimitive implements ISeriesPrimitive<Time> {
  private _options: HighlightBarCrosshairOptions
  _paneViews: CrosshairHighlightPaneView[]
  _data: CrosshairHighlightData = {
    x: 0,
    visible: false,
    color: 'rgba(0, 0, 0, 0.2)',
    barSpacing: 6,
  }
  _attachedParams: SeriesAttachedParameter<Time> | undefined

  constructor(options: Partial<HighlightBarCrosshairOptions>) {
    this._options = {
      ...defaultOptions,
      ...options,
    }
    this._paneViews = [new CrosshairHighlightPaneView(this._data)]
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
    this._paneViews.forEach((pw) => pw.update(this._data))
  }

  setData(data: CrosshairHighlightData) {
    this._data = data
    this.updateAllViews()
    this._attachedParams?.requestUpdate()
  }

  currentColor() {
    return this._options.color
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
    if (!chart) return 6
    const ts = chart.timeScale()
    const visibleLogicalRange = ts.getVisibleLogicalRange()
    if (!visibleLogicalRange) return 6
    return ts.width() / (visibleLogicalRange.to + 1 - visibleLogicalRange.from)
  }

  private _onMouseMove(param: MouseEventParams) {
    const chart = this.chart()
    const logical = param.logical
    if (logical === null || logical === undefined || !chart) {
      this.setData({
        x: 0,
        visible: false,
        color: this.currentColor(),
        barSpacing: this._barSpacing(),
      })
      return
    }
    const coordinate = chart.timeScale().logicalToCoordinate(logical)
    this.setData({
      x: coordinate ?? 0,
      visible: coordinate !== null,
      color: this.currentColor(),
      barSpacing: this._barSpacing(),
    })
  }
}
