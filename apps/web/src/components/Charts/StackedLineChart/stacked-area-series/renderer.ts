/**
 * Copied and modified from: https://github.com/tradingview/lightweight-charts/blob/f13a3c1f3fefcace9d4da5b97c1638009298b3c8/plugin-examples/src/plugins/stacked-area-series
 * Modifications are called out with comments.
 */

import { StackedAreaData } from 'components/Charts/StackedLineChart/stacked-area-series/data'
import { StackedAreaSeriesOptions } from 'components/Charts/StackedLineChart/stacked-area-series/options'
import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from 'fancy-canvas'
import {
  ICustomSeriesPaneRenderer,
  PaneRendererCustomData,
  PriceToCoordinateConverter,
  Range,
  Time,
} from 'lightweight-charts'

interface Position {
  x: number
  y: number
}

interface LinePathData {
  path: Path2D
  first: Position
  last: Position
}

interface StackedAreaBarItem {
  x: number
  ys: number[]
}

function cumulativeBuildUp(arr: number[]): number[] {
  let sum = 0
  return arr.map((value) => {
    const newValue = sum + value
    sum = newValue
    return newValue
  })
}

export class StackedAreaSeriesRenderer<TData extends StackedAreaData> implements ICustomSeriesPaneRenderer {
  _data: PaneRendererCustomData<Time, TData> | null = null
  _options: StackedAreaSeriesOptions | null = null

  draw(target: CanvasRenderingTarget2D, priceConverter: PriceToCoordinateConverter): void {
    target.useBitmapCoordinateSpace((scope) => this._drawImpl(scope, priceConverter))
  }

  update(data: PaneRendererCustomData<Time, TData>, options: StackedAreaSeriesOptions): void {
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

    const options = this._options
    const bars: StackedAreaBarItem[] = this._data.bars.map((bar) => {
      return {
        x: bar.x,
        ys: cumulativeBuildUp(bar.originalData.values).map((value) => priceToCoordinate(value) ?? 0),
      }
    })
    const zeroY = priceToCoordinate(0) ?? 0
    const colorsCount = options.colors.length
    const isV4DataEnabled = options.colors.length === 3
    const { linesMeshed, hoverInfo } = this._createLinePaths({
      bars,
      visibleRange: this._data.visibleRange,
      renderingScope,
      zeroY: zeroY * renderingScope.verticalPixelRatio,
      hoveredIndex: options.hoveredLogicalIndex,
      isV4DataEnabled,
    })

    const fullLinesMeshed = linesMeshed.slice(0, colorsCount + 1)
    const highlightLinesMeshed = options.hoveredLogicalIndex ? linesMeshed.slice(colorsCount + 1) : []

    const areaPaths = this._createAreas(fullLinesMeshed)

    const isHovered = options.hoveredLogicalIndex && options.hoveredLogicalIndex !== -1
    areaPaths.forEach((areaPath, index) => {
      // Modification: determine area fill opacity based on number of lines and hover state

      if (areaPaths.length === 1) {
        ctx.globalAlpha = 0.12 // single-line charts have low opacity fill
      }

      const gradient = options.gradients
        ? ctx.createLinearGradient(0, 0, renderingScope.mediaSize.width * 2.25, 0)
        : undefined
      gradient?.addColorStop(0, options.gradients?.[index % colorsCount].start ?? 'transparent')
      // End the gradient at the x-coordinate of the crosshair relative to chart width or the end of the chart
      const gradientStop = Math.max(hoverInfo.x ? hoverInfo.x / renderingScope.bitmapSize.width : 1, 0)
      gradient?.addColorStop(gradientStop, options.gradients?.[index % colorsCount].end ?? 'transparent')

      ctx.fillStyle = gradient ?? options.colors[index % colorsCount]
      ctx.fill(areaPath)
    })

    ctx.lineWidth = options.lineWidth
    ctx.lineJoin = 'round'

    fullLinesMeshed.toReversed().forEach((linePath, index) => {
      const color = options.colors[colorsCount - (index + 1)]
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.globalAlpha = isHovered ? 0.24 : 1

      // Bottom line is just the x-axis, which should not be drawn
      if (index !== fullLinesMeshed.length - 1) {
        // Line rendering:
        ctx.beginPath()
        ctx.stroke(linePath.path)
        // Modification: Draws a glyph where lines intersect with the crosshair
        const hoverY = hoverInfo.points.toReversed()[index]
        // Reset the global alpha to 1 after filling in the area under the graph and before drawing the glyph
        ctx.globalAlpha = 1

        // Glyph rendering:
        ctx.globalCompositeOperation = 'destination-out' // This mode allows removing a portion of the drawn line from the canvas
        ctx.beginPath()
        ctx.arc(hoverInfo.x, hoverY, 5 * renderingScope.verticalPixelRatio, 0, 2 * Math.PI)
        ctx.fill() // Cuts a hole out of the line where part of the glyph should be rendered

        ctx.globalCompositeOperation = 'source-over' // Resets to default mode
        ctx.beginPath()

        ctx.arc(hoverInfo.x, hoverY, 3 * renderingScope.verticalPixelRatio, 0, 2 * Math.PI)
        ctx.fill() // Draws innermost portion of glyph

        ctx.globalAlpha = 0.2
        ctx.beginPath()
        ctx.arc(hoverInfo.x, hoverY, 8 * renderingScope.verticalPixelRatio, 0, 2 * Math.PI)
        ctx.fill() // Draws middle portion of glyph

        ctx.globalAlpha = 0.3
        ctx.beginPath()
        ctx.arc(hoverInfo.x, hoverY, 12 * renderingScope.verticalPixelRatio, 0, 2 * Math.PI)
        ctx.fill() // Draws outer portion of glyph
      }

      ctx.globalAlpha = 1
    })

    highlightLinesMeshed.toReversed().forEach((linePath, index) => {
      const color = options.colors[colorsCount - (index + 1)]
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.globalAlpha = 1

      // Line rendering:
      ctx.beginPath()
      ctx.stroke(linePath.path)
    })
  }

  /** Builds canvas line paths based on input data  */
  _createLinePaths({
    bars,
    visibleRange,
    renderingScope,
    zeroY,
    hoveredIndex,
    isV4DataEnabled,
  }: {
    bars: StackedAreaBarItem[]
    visibleRange: Range<number>
    renderingScope: BitmapCoordinatesRenderingScope
    zeroY: number
    hoveredIndex?: number | null
    isV4DataEnabled?: boolean
  }) {
    const { horizontalPixelRatio, verticalPixelRatio } = renderingScope
    const v2Lines: LinePathData[] = []
    const v3Lines: LinePathData[] = []
    const v4Lines: LinePathData[] = []
    const v2HighlightLines: LinePathData[] = []
    const v3HighlightLines: LinePathData[] = []
    const v4HighlightLines: LinePathData[] = []

    let firstBar = true

    // Modification: tracks and returns coordinates of where a glyph should be rendered for each line when a crosshair is drawn
    const hoverInfo = { points: [] as number[], x: 0 }

    const numLines = isV4DataEnabled ? 3 : 2
    // Modification: updated loop to include one point above and below the visible range to ensure the line is drawn to edges of chart
    for (let i = visibleRange.from - 1; i < visibleRange.to + 1; i++) {
      if (i >= bars.length || i < 0) {
        continue
      }

      const stack = bars[i]
      let lineIndex = 0
      stack.ys.forEach((yMedia, index) => {
        if (index % numLines !== 0) {
          return
        }

        const x = stack.x * horizontalPixelRatio
        const y = yMedia * verticalPixelRatio

        if (i === hoveredIndex) {
          hoverInfo.points[index] = y
          hoverInfo.x = x
        }

        if (firstBar) {
          v2Lines[lineIndex] = {
            path: new Path2D(),
            first: { x, y },
            last: { x, y },
          }
          v2Lines[lineIndex].path.moveTo(x, y)
        } else {
          v2Lines[lineIndex].path.lineTo(x, y)
          v2Lines[lineIndex].last.x = x
          v2Lines[lineIndex].last.y = y
        }
        if (firstBar && hoveredIndex && i <= hoveredIndex) {
          v2HighlightLines[lineIndex] = {
            path: new Path2D(),
            first: { x, y },
            last: { x, y },
          }
          v2HighlightLines[lineIndex].path.moveTo(x, y)
        } else if (hoveredIndex && i <= hoveredIndex) {
          v2HighlightLines[lineIndex].path.lineTo(x, y)
          v2HighlightLines[lineIndex].last.x = x
          v2HighlightLines[lineIndex].last.y = y
        }
        lineIndex += 1
      })
      firstBar = false
    }
    firstBar = true
    // Modification: updated loop to include one point above and below the visible range to ensure the line is drawn to edges of chart
    for (let i = visibleRange.to + 1; i >= visibleRange.from - 1; i--) {
      if (i >= bars.length || i < 0) {
        continue
      }
      const stack = bars[i]
      let lineIndex = 0
      stack.ys.forEach((yMedia, index) => {
        if (index % numLines !== 1) {
          return
        }

        const x = stack.x * horizontalPixelRatio
        const y = yMedia * verticalPixelRatio

        if (i === hoveredIndex) {
          hoverInfo.points[index] = y
          hoverInfo.x = x
        }

        if (firstBar) {
          v3Lines[lineIndex] = {
            path: new Path2D(),
            first: { x, y },
            last: { x, y },
          }
          v3Lines[lineIndex].path.moveTo(x, y)
        } else {
          v3Lines[lineIndex].path.lineTo(x, y)
          v3Lines[lineIndex].last.x = x
          v3Lines[lineIndex].last.y = y
        }

        if (v3HighlightLines.length <= lineIndex && hoveredIndex && i <= hoveredIndex) {
          v3HighlightLines[lineIndex] = {
            path: new Path2D(),
            first: { x, y },
            last: { x, y },
          }
          v3HighlightLines[lineIndex].path.moveTo(x, y)
        } else if (hoveredIndex && i <= hoveredIndex) {
          v3HighlightLines[lineIndex].path.lineTo(x, y)
          v3HighlightLines[lineIndex].last.x = x
          v3HighlightLines[lineIndex].last.y = y
        }

        lineIndex += 1
      })
      firstBar = false
    }
    firstBar = true

    // Modification: updated loop to include one point above and below the visible range to ensure the line is drawn to edges of chart
    for (let i = visibleRange.to + 1; i >= visibleRange.from - 1; i--) {
      if (i >= bars.length || i < 0) {
        continue
      }
      const stack = bars[i]
      let lineIndex = 0
      stack.ys.forEach((yMedia, index) => {
        if (index % numLines !== 2 || !isV4DataEnabled) {
          return
        }

        const x = stack.x * horizontalPixelRatio
        const y = yMedia * verticalPixelRatio

        if (i === hoveredIndex) {
          hoverInfo.points[index] = y
          hoverInfo.x = x
        }

        if (firstBar) {
          v4Lines[lineIndex] = {
            path: new Path2D(),
            first: { x, y },
            last: { x, y },
          }
          v4Lines[lineIndex].path.moveTo(x, y)
        } else {
          v4Lines[lineIndex].path.lineTo(x, y)
          v4Lines[lineIndex].last.x = x
          v4Lines[lineIndex].last.y = y
        }

        if (v4HighlightLines.length <= lineIndex && hoveredIndex && i <= hoveredIndex) {
          v4HighlightLines[lineIndex] = {
            path: new Path2D(),
            first: { x, y },
            last: { x, y },
          }
          v4HighlightLines[lineIndex].path.moveTo(x, y)
        } else if (hoveredIndex && i <= hoveredIndex) {
          v4HighlightLines[lineIndex].path.lineTo(x, y)
          v4HighlightLines[lineIndex].last.x = x
          v4HighlightLines[lineIndex].last.y = y
        }

        lineIndex += 1
      })
      firstBar = false
    }

    const baseLine = {
      path: new Path2D(),
      first: { x: v2Lines[0].last.x, y: zeroY },
      last: { x: v2Lines[0].first.x, y: zeroY },
    }
    baseLine.path.moveTo(v2Lines[0].last.x, zeroY)
    baseLine.path.lineTo(v2Lines[0].first.x, zeroY)
    const linesMeshed: LinePathData[] = [baseLine]
    for (let i = 0; i < v2Lines.length; i++) {
      linesMeshed.push(v2Lines[i])
      if (i < v3Lines.length) {
        linesMeshed.push(v3Lines[i])
      }
      if (i < v4Lines.length && isV4DataEnabled) {
        linesMeshed.push(v4Lines[i])
      }
      if (hoveredIndex) {
        linesMeshed.push(v2HighlightLines[i])
        linesMeshed.push(v3HighlightLines[i])
        isV4DataEnabled && linesMeshed.push(v4HighlightLines[i])
      }
    }

    return { linesMeshed, hoverInfo }
  }

  /** Builds canvas area paths to fill under lines */
  _createAreas(linesMeshed: LinePathData[]): Path2D[] {
    const areas: Path2D[] = []
    for (let i = 1; i < linesMeshed.length; i++) {
      // The first area must reference the base line, aka index 0
      // All other areas need to reference the first area to fully fill the bottom of the graph
      const baseReferenceIndex = Math.min(i - 1, 1)
      const areaPath = new Path2D(linesMeshed[baseReferenceIndex].path)
      areaPath.lineTo(linesMeshed[i].first.x, linesMeshed[i].first.y)
      areaPath.addPath(linesMeshed[i].path)
      areaPath.lineTo(linesMeshed[baseReferenceIndex].first.x, linesMeshed[baseReferenceIndex].first.y)
      areaPath.closePath()
      areas.push(areaPath)
    }
    return areas
  }
}
