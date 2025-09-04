import { LiquidityBarData, LiquidityBarProps, LiquidityBarSeriesOptions } from 'components/Charts/LiquidityChart/types'
import { roundRect } from 'components/Charts/utils'
import { ColumnPosition, calculateColumnPositionsInPlace, positionsBox } from 'components/Charts/VolumeChart/utils'
import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from 'fancy-canvas'
import { ICustomSeriesPaneRenderer, PaneRendererCustomData, PriceToCoordinateConverter, Time } from 'lightweight-charts'

interface LiquidityBarItem {
  x: number
  y: number
  column?: ColumnPosition
  tick: number
}

export class LiquidityBarSeriesRenderer<TData extends LiquidityBarData> implements ICustomSeriesPaneRenderer {
  _data: PaneRendererCustomData<Time, TData> | null = null
  _options: LiquidityBarProps & Partial<LiquidityBarSeriesOptions>

  constructor(props: LiquidityBarProps) {
    this._options = props
    this._options.hoveredTick = props.activeTick
  }

  draw(target: CanvasRenderingTarget2D, priceConverter: PriceToCoordinateConverter): void {
    target.useBitmapCoordinateSpace((scope) => this._drawImpl(scope, priceConverter))
  }

  update(data: PaneRendererCustomData<Time, TData>, options: LiquidityBarSeriesOptions): void {
    this._data = data
    this._options = { ...this._options, ...options }
  }

  _drawImpl(renderingScope: BitmapCoordinatesRenderingScope, priceToCoordinate: PriceToCoordinateConverter): void {
    if (this._data === null || this._data.bars.length === 0 || this._data.visibleRange === null) {
      return
    }
    const ctx = renderingScope.context
    const bars: LiquidityBarItem[] = this._data.bars.map((bar) => {
      return {
        x: bar.x,
        y: priceToCoordinate(bar.originalData.liquidity) ?? 0,
        tick: bar.originalData.tick,
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
    ctx.fillStyle = this._options.tokenAColor

    for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
      const stack = bars[i]
      const column = stack.column
      const isCurrentTick = this._options.activeTick === stack.tick
      const isHoveredTick = this._options.hoveredTick === stack.tick

      if (!column) {
        return
      }
      const width = Math.min(
        Math.max(renderingScope.horizontalPixelRatio, column.right - column.left),
        this._data.barSpacing * renderingScope.horizontalPixelRatio,
      )

      // Create margin to make visual bars thin
      const margin = 0.3 * width
      const widthWithMargin = width - margin * 2
      const totalBox = positionsBox({
        position1Media: zeroY,
        position2Media: stack.y,
        pixelRatio: renderingScope.verticalPixelRatio,
      })

      if (isHoveredTick) {
        const highlightOffset = 0.3 * ctx.canvas.height
        const highlightLength = ctx.canvas.height - highlightOffset

        // Draw background highlight bar
        ctx.fillStyle = this._options.highlightColor
        roundRect({
          ctx,
          x: column.left + margin,
          y: highlightOffset,
          w: widthWithMargin,
          h: highlightLength,
          radii: 8,
        })

        ctx.globalAlpha = 1
      } else {
        // Reduce opacity of non-hovered bars
        ctx.globalAlpha = 0.4
      }

      // Select color based on where current bar is in relation to activeTick
      if (isCurrentTick) {
        ctx.fillStyle = this._options.tokenBColor
      } else if (this._options.activeTick === undefined) {
        ctx.fillStyle = this._options.color ?? 'white'
      } else if (this._options.activeTick > stack.tick) {
        ctx.fillStyle = this._options.tokenBColor
      } else if (this._options.activeTick < stack.tick) {
        ctx.fillStyle = this._options.tokenAColor
      }

      // Draw bar
      roundRect({
        ctx,
        x: column.left + margin,
        y: totalBox.position,
        w: widthWithMargin,
        h: totalBox.length,
        radii: 8,
      })

      // Reset opacity
      ctx.globalAlpha = 1

      if (isCurrentTick && this._options.activeTickProgress) {
        // Draw token A color on top of token B color for active range
        ctx.globalCompositeOperation = 'source-atop'

        // Token A color takes up activeTickProgress % of the bar height
        const activeRangeAdjustedHeight = totalBox.length * this._options.activeTickProgress
        const activeRangeAdjustedPosition = totalBox.position + (totalBox.length - activeRangeAdjustedHeight)

        ctx.fillStyle = this._options.tokenAColor
        ctx.beginPath()
        ctx.fillRect(column.left, activeRangeAdjustedPosition, width, activeRangeAdjustedHeight)

        // Reset composite operation to default
        ctx.globalCompositeOperation = 'source-over'
      }
    }
  }
}
