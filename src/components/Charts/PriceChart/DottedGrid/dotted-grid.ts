import { CanvasRenderingTarget2D } from 'fancy-canvas'
import {
  ISeriesPrimitive,
  ISeriesPrimitivePaneRenderer,
  ISeriesPrimitivePaneView,
  SeriesAttachedParameter,
  SeriesPrimitivePaneViewZOrder,
  Time,
} from 'lightweight-charts'

interface DottedGridPrimitiveOptions {
  color: string
  dotRadius: number
}

export class DottedGridPrimitive implements ISeriesPrimitive<Time> {
  color: string
  dotRadius: number
  _timeMarks: { coord: number }[] = []
  _priceMarks: { coord: number }[] = []
  _attachedParams: SeriesAttachedParameter<Time> | undefined
  _gridPaneView: DottedGridPaneView
  _paneViews: ISeriesPrimitivePaneView[]

  constructor({ color, dotRadius }: DottedGridPrimitiveOptions) {
    this.color = color
    this.dotRadius = dotRadius
    this._gridPaneView = new DottedGridPaneView({
      getXCoords: this.timeMarks,
      getYCoords: this.priceMarks,
      color,
      dotRadius,
    })
    this._paneViews = [this._gridPaneView]
  }

  attached(param: SeriesAttachedParameter<Time>): void {
    this._attachedParams = param
    param.chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      this._gridPaneView.update({
        getXCoords: this.timeMarks,
        getYCoords: this.priceMarks,
      })
    })
  }

  paneViews() {
    return this._paneViews
  }

  get pane() {
    return ((this._attachedParams?.chart as any) ?? {})?._private__chartWidget._private__model._private__panes?.[0]
  }

  timeMarks(): number[] {
    console.log('cartcrom', this.pane._private__timeScale)

    return Object.values(this.pane._private__timeScale._private__timeMarksCache).map((m: any) => m.coord)
  }

  priceMarks(): number[] {
    return Object.values(this.pane._private__rightPriceScale._private__marksCache).map((m: any) => m.coord)
  }
}

class DottedGridPaneView implements ISeriesPrimitivePaneView {
  constructor(private _data: DottedGridRendererData) {}

  update(data: Partial<DottedGridRendererData>): void {
    this._data = {
      ...this._data,
      ...data,
    }
  }

  renderer(): ISeriesPrimitivePaneRenderer | null {
    return new DottedGridRenderer(this._data)
  }

  zOrder(): SeriesPrimitivePaneViewZOrder {
    return 'top'
  }
}

function strokeInPixel(ctx: CanvasRenderingContext2D, drawFunction: () => void): void {
  ctx.save()
  if (ctx.lineWidth % 2) {
    ctx.translate(0.5, 0.5)
  }
  drawFunction()
  ctx.restore()
}

interface DottedGridRendererData {
  getXCoords: () => number[]
  getYCoords: () => number[]
  dotRadius: number
  color: string
}

class DottedGridRenderer implements ISeriesPrimitivePaneRenderer {
  constructor(private _data: DottedGridRendererData) {}

  draw(target: CanvasRenderingTarget2D) {
    target.useMediaCoordinateSpace((scope) => {
      const ctx = scope.context
      console.log('cartcrom0')
      // const lineWidth = Math.max(1, Math.floor(horizontalPixelRatio))
      // ctx.lineWidth = lineWidth

      strokeInPixel(ctx, () => {
        console.log('cartcrom1')
        // const data = ensureNotNull(this._data)

        ctx.fillStyle = this._data.color
        // setLineStyle(ctx, data.vertLineStyle)
        ctx.beginPath()
        for (const xCoord of this._data.getXCoords()) {
          console.log('cartcrom', xCoord)
          // const x = Math.round(xCoord * horizontalPixelRatio)
          // ctx.moveTo(x, -lineWidth);
          // ctx.lineTo(x, bitmapSize.height + lineWidth);

          for (const yCoord of this._data.getYCoords()) {
            console.log('cartcrom', xCoord, yCoord)
            // const y = Math.round(yCoord * verticalPixelRatio)

            ctx.moveTo(xCoord, yCoord)
            ctx.arc(xCoord, yCoord, 1, 0, Math.PI * 2)
          }
        }
        ctx.fill()
      })
    })
  }
}
