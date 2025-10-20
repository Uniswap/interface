/**
 * Copied from https://github.com/tradingview/lightweight-charts/blob/master/plugin-examples/src/plugins/stacked-bars-series/renderer.ts
 * Modifications are called out with comments.
 */

import { GraphQLApi } from '@universe/api'
import { roundRect } from 'components/Charts/utils'
import {
  ColumnPosition,
  calculateColumnPositionsInPlace,
  isStackedHistogramData,
  positionsBox,
} from 'components/Charts/VolumeChart/utils'
import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from 'fancy-canvas'
import {
  CustomData,
  CustomSeriesOptions,
  ICustomSeriesPaneRenderer,
  PaneRendererCustomData,
  PriceToCoordinateConverter,
  Time,
  UTCTimestamp,
} from 'lightweight-charts'

// Modification: custom implementations of lw-chart's histogram data types
export interface SingleHistogramData extends CustomData {
  value: number
  time: UTCTimestamp
}

export interface StackedHistogramData extends CustomData {
  values: Record<GraphQLApi.PriceSource, number | undefined>
  time: UTCTimestamp
}

export type CustomHistogramData = SingleHistogramData | StackedHistogramData

interface BarItem {
  x: number
  ys: number[]
  column?: ColumnPosition
}

export interface CustomHistogramSeriesOptions extends CustomSeriesOptions {
  colors: string[]
  hoveredXPos?: number
}

function cumulativeBuildUp(data: StackedHistogramData): number[] {
  let sum = 0
  return Object.values(data.values)
    .filter((value: number | undefined): value is number => value !== undefined)
    .map((value) => {
      const newValue = sum + value
      sum = newValue
      return newValue
    })
}

export interface CustomHistogramProps {
  colors: string[]
  background?: string
}

export class CustomHistogramSeriesRenderer<TData extends CustomHistogramData> implements ICustomSeriesPaneRenderer {
  _data: PaneRendererCustomData<Time, TData> | null = null
  _options: CustomHistogramSeriesOptions | null = null
  _colors: string[]
  _background?: string

  constructor(props: CustomHistogramProps) {
    this._colors = props.colors
    this._background = props.background
  }

  draw(target: CanvasRenderingTarget2D, priceConverter: PriceToCoordinateConverter): void {
    target.useBitmapCoordinateSpace((scope) => this._drawImpl(scope, priceConverter, this._options?.hoveredXPos))
  }

  update(data: PaneRendererCustomData<Time, TData>, options: CustomHistogramSeriesOptions): void {
    this._data = data
    this._options = options
  }

  // eslint-disable-next-line max-params
  _drawImpl(
    renderingScope: BitmapCoordinatesRenderingScope,
    priceToCoordinate: PriceToCoordinateConverter,
    hoveredXPos?: number | null,
  ): void {
    if (
      this._data === null ||
      this._data.bars.length === 0 ||
      this._data.visibleRange === null ||
      this._options === null
    ) {
      return
    }
    const ctx = renderingScope.context
    const bars: BarItem[] = this._data.bars.map((bar) => {
      // Modification: CustomHistogramSeries is generalized to handle both single and stacked histograms
      const cumulativePrice = isStackedHistogramData(bar.originalData)
        ? cumulativeBuildUp(bar.originalData)
        : [bar.originalData.value]
      return {
        x: bar.x,
        ys: cumulativePrice.map((value) => priceToCoordinate(value) ?? 0),
      }
    })
    calculateColumnPositionsInPlace({
      items: bars,
      barSpacingMedia: this._data.barSpacing,
      horizontalPixelRatio: renderingScope.horizontalPixelRatio,
      startIndex: this._data.visibleRange.from,
      endIndex: this._data.visibleRange.to,
    })
    const zeroY = priceToCoordinate(0) ?? 0
    for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
      const stack = bars[i]
      const column = stack.column
      if (!column) {
        return
      }
      let previousY = zeroY
      const width = Math.min(
        Math.max(renderingScope.horizontalPixelRatio, column.right - column.left),
        this._data.barSpacing * renderingScope.horizontalPixelRatio,
      )

      // Modification: increase space between bars
      const margin = width * 0.075

      // Modification: draw rounded rect corresponding to total volume
      const totalBox = positionsBox({
        position1Media: zeroY,
        position2Media: stack.ys[stack.ys.length - 1],
        pixelRatio: renderingScope.verticalPixelRatio,
      })

      if (this._background) {
        ctx.fillStyle = this._background
      }

      roundRect({
        ctx,
        x: column.left + margin,
        y: totalBox.position,
        w: width - margin,
        h: totalBox.length,
      })

      // Modification: draw the stack's boxes atop the total volume bar, resulting in the top and bottom boxes being rounded
      ctx.globalCompositeOperation = 'source-atop'
      const isStackedHistogram = stack.ys.length > 1
      // Determine if bar is being hovered by checking if the cursor is without the bounds of the bar
      const isHovered = hoveredXPos && hoveredXPos >= stack.x - width / 4 && hoveredXPos <= stack.x + width / 4 + 1
      stack.ys.forEach((y, index) => {
        // Skip bars with no volume
        if (y === previousY) {
          return
        }

        const color = this._colors[this._colors.length - 1 - index] // color v2, then v3
        const stackBoxPositions = positionsBox({
          position1Media: previousY,
          position2Media: y,
          pixelRatio: renderingScope.verticalPixelRatio,
        })
        ctx.fillStyle = color
        ctx.globalAlpha = isStackedHistogram && !isHovered ? 0.24 : 1
        ctx.fillRect(column.left + margin, stackBoxPositions.position, width - margin, stackBoxPositions.length)
        if (isStackedHistogram && !isHovered) {
          ctx.globalAlpha = 1
          ctx.fillStyle = color
          ctx.fillRect(column.left + margin, stackBoxPositions.position, width - margin, 2)
        }
        previousY = y
      })

      // reset global settings
      ctx.globalCompositeOperation = 'source-over'
    }
  }
}
