/**
 * Copied from https://github.com/tradingview/lightweight-charts/blob/master/plugin-examples/src/plugins/stacked-bars-series/renderer.ts
 * Modifications are called out with comments.
 */
import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from 'fancy-canvas'
import {
  CustomSeriesOptions,
  ICustomSeriesPaneRenderer,
  PaneRendererCustomData,
  PriceToCoordinateConverter,
  Time,
  UTCTimestamp,
} from 'lightweight-charts'
import { CustomData } from 'lightweight-charts'

import { calculateColumnPositionsInPlace, ColumnPosition, positionsBox } from './utils'

export interface StackedBarsData extends CustomData {
  time: UTCTimestamp
  values: { v2?: number; v3?: number }
}

interface StackedBarsBarItem {
  x: number
  ys: number[]
  column?: ColumnPosition
}

export interface StackedBarsSeriesOptions extends CustomSeriesOptions {
  colors: [string, string]
}

function cumulativeBuildUp(arr: number[]): number[] {
  let sum = 0
  return arr.map((value) => {
    const newValue = sum + value
    sum = newValue
    return newValue
  })
}

export interface StackedBarsProps {
  colors: [string, string]
}
export class StackedBarsSeriesRenderer<TData extends StackedBarsData> implements ICustomSeriesPaneRenderer {
  _data: PaneRendererCustomData<Time, TData> | null = null
  _options: StackedBarsSeriesOptions | null = null
  _colors: [string, string]

  constructor(props: StackedBarsProps) {
    this._colors = props.colors
  }

  draw(target: CanvasRenderingTarget2D, priceConverter: PriceToCoordinateConverter): void {
    target.useBitmapCoordinateSpace((scope) => this._drawImpl(scope, priceConverter))
  }

  update(data: PaneRendererCustomData<Time, TData>, options: StackedBarsSeriesOptions): void {
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
    const ctx = renderingScope.context
    const bars: StackedBarsBarItem[] = this._data.bars.map((bar) => {
      return {
        x: bar.x,
        ys: cumulativeBuildUp([bar.originalData.values.v2 ?? 0, bar.originalData.values.v3 ?? 0]).map(
          (value) => priceToCoordinate(value) ?? 0
        ),
      }
    })
    calculateColumnPositionsInPlace(
      bars,
      this._data.barSpacing,
      renderingScope.horizontalPixelRatio,
      this._data.visibleRange.from,
      this._data.visibleRange.to
    )
    const zeroY = priceToCoordinate(0) ?? 0
    for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
      const stack = bars[i]
      const column = stack.column
      if (!column) return
      let previousY = zeroY
      const width = Math.min(
        Math.max(renderingScope.horizontalPixelRatio, column.right - column.left),
        this._data.barSpacing * renderingScope.horizontalPixelRatio
      )

      // Modification: increase space between bars
      const margin = width * 0.075

      // Modification: draw rounded rect corresponding to total volume
      const totalBox = positionsBox(zeroY, stack.ys[stack.ys.length - 1], renderingScope.verticalPixelRatio)
      ctx.beginPath()
      ctx.roundRect(column.left + margin, totalBox.position, width - margin, totalBox.length, 8)
      ctx.fill()

      // Modification: draw the stack's boxes atop the total volume bar, resulting in the top and bottom boxes being rounded
      ctx.globalCompositeOperation = 'source-atop'
      stack.ys.forEach((y, index) => {
        const color = this._colors[this._colors.length - 1 - index] // color v2, then v3
        const stackBoxPositions = positionsBox(previousY, y, renderingScope.verticalPixelRatio)
        ctx.fillStyle = color
        ctx.fillRect(column.left + margin, stackBoxPositions.position, width - margin, stackBoxPositions.length)
        previousY = y
      })

      // reset global settings
      ctx.globalCompositeOperation = 'source-over'
    }
  }
}
