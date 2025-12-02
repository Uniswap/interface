import { roundRect } from 'components/Charts/utils'
import { ColumnPosition, calculateColumnPositionsInPlace, positionsBox } from 'components/Charts/VolumeChart/utils'
import {
  BAR_STYLE,
  CLEARING_PRICE_LINE,
  CONCENTRATION_GRADIENT,
  TOLERANCE,
} from 'components/Toucan/Auction/BidDistributionChart/constants'
import { findClearingPriceXPosition } from 'components/Toucan/Auction/BidDistributionChart/utils/clearingPrice/position'
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
import { logger } from 'utilities/src/logger/logger'

/**
 * Custom renderer for Toucan bid distribution chart
 * Simplified histogram renderer designed specifically for bid distribution display
 */

export interface ToucanChartData extends CustomData {
  value: number
  time: UTCTimestamp
  tickValue?: number
}

interface BarItem {
  x: number
  y: number
  column?: ColumnPosition
  tickValue: number // stored for bar coloring logic
}

export interface ToucanChartSeriesOptions extends CustomSeriesOptions {
  barColors: BarColors
}

interface BarColors {
  clearingPriceColor: string
  aboveClearingPriceColor: string
  belowClearingPriceColor: string
}

interface LabelColors {
  background: string
  border: string
  text: string
}

interface LabelStyles {
  fontFamily: string
}

interface ConcentrationBand {
  startIndex: number
  endIndex: number
  startTick: number
  endTick: number
}

export interface ToucanChartProps {
  barColors: BarColors
  labelColors: LabelColors
  labelStyles: LabelStyles
  clearingPrice: number // Clearing price in fiat (for conditional bar styling)
  tickSize: number
  concentrationBand?: ConcentrationBand | null // Concentration band indices
  clearingPriceLabel?: string // Formatted label to display above the clearing price line
}

export class ToucanChartSeriesRenderer implements ICustomSeriesPaneRenderer {
  _data: PaneRendererCustomData<Time, ToucanChartData> | null = null
  _options: ToucanChartSeriesOptions | null = null
  _barColors: BarColors
  _labelColors: LabelColors
  _labelStyles: LabelStyles
  _clearingPrice: number
  _tickSize: number
  _concentrationBand?: ConcentrationBand | null
  _clearingPriceLabel?: string

  constructor(props: ToucanChartProps) {
    this._barColors = props.barColors
    this._labelColors = props.labelColors
    this._labelStyles = props.labelStyles
    this._clearingPrice = props.clearingPrice
    this._tickSize = props.tickSize
    this._concentrationBand = props.concentrationBand
    this._clearingPriceLabel = props.clearingPriceLabel
  }

  draw(target: CanvasRenderingTarget2D, priceConverter: PriceToCoordinateConverter): void {
    target.useBitmapCoordinateSpace((scope) => this._drawImpl(scope, priceConverter))
  }

  update(data: PaneRendererCustomData<Time, ToucanChartData>, options: ToucanChartSeriesOptions): void {
    this._data = data
    this._options = options
  }

  /**
   * Determines the fill color for a bar based on its tick value relative to clearing price
   * and whether it's within the concentration band
   */
  _getBarColor(tickValue: number): { color: string } {
    const tolerance = this._tickSize * TOLERANCE.TICK_COMPARISON

    const isInConcentration =
      this._concentrationBand &&
      tickValue >= this._concentrationBand.startTick - tolerance &&
      tickValue <= this._concentrationBand.endTick + tolerance

    // Use tolerance-based comparison for clearing price (not direct equality)
    if (Math.abs(tickValue - this._clearingPrice) < tolerance) {
      return { color: this._barColors.clearingPriceColor }
    }

    if (tickValue < this._clearingPrice) {
      return { color: this._barColors.belowClearingPriceColor }
    }

    if (isInConcentration) {
      return { color: this._barColors.clearingPriceColor }
    }

    return { color: this._barColors.aboveClearingPriceColor }
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

    const bars: BarItem[] = this._data.bars.map((bar) => {
      // Get tick value from the original data
      const tickValue = bar.originalData.tickValue ?? 0

      return {
        x: bar.x,
        y: priceToCoordinate(bar.originalData.value) ?? 0,
        tickValue,
      }
    })

    calculateColumnPositionsInPlace({
      items: bars,
      barSpacingMedia: this._data.barSpacing,
      horizontalPixelRatio: renderingScope.horizontalPixelRatio,
      startIndex: Math.floor(this._data.visibleRange.from),
      endIndex: Math.ceil(this._data.visibleRange.to),
    })

    const zeroY = priceToCoordinate(0) ?? 0
    const start = Math.max(0, Math.floor(this._data.visibleRange.from))
    const end = Math.min(bars.length, Math.ceil(this._data.visibleRange.to))

    // Draw concentration gradient if it exists
    if (this._concentrationBand) {
      this._drawConcentrationGradient(renderingScope, bars)
    }

    // Draw clearing price line if clearing price is available
    this._drawClearingPriceLine(renderingScope, bars)

    for (let i = start; i < end; i++) {
      const bar = bars[i]
      const column = bar.column
      if (!column) {
        continue
      }

      const width = Math.min(
        Math.max(renderingScope.horizontalPixelRatio, column.right - column.left),
        this._data.barSpacing * renderingScope.horizontalPixelRatio,
      )

      const xMargin = BAR_STYLE.SPACING * renderingScope.horizontalPixelRatio

      // Calculate final bar width after margin, ensuring minimum 1px width
      const barWidth = Math.max(renderingScope.horizontalPixelRatio, width - xMargin)

      const barBox = positionsBox({
        position1Media: zeroY,
        position2Media: bar.y,
        pixelRatio: renderingScope.verticalPixelRatio,
      })

      // Determine bar color based on tick value, clearing price, and concentration band
      const barColorInfo = this._getBarColor(bar.tickValue)

      // Draw bar with conditional color
      ctx.fillStyle = barColorInfo.color
      ctx.globalAlpha = 1

      roundRect({
        ctx,
        x: column.left + xMargin,
        y: barBox.position,
        w: barWidth,
        h: barBox.length,
        radii: BAR_STYLE.BORDER_RADIUS,
      })

      ctx.globalAlpha = 1
    }
  }

  /**
   * Draw a vertical line at the clearing price position with optional label
   */
  _drawClearingPriceLine(renderingScope: BitmapCoordinatesRenderingScope, bars: BarItem[]): void {
    if (!this._data || !this._tickSize) {
      return
    }

    // Use pure utility function to calculate line position
    const lineX = findClearingPriceXPosition({
      clearingPrice: this._clearingPrice,
      bars,
    })

    if (lineX === null) {
      return
    }

    // Render the line
    this._renderClearingPriceLine(renderingScope, lineX)

    // Render label if provided
    if (this._clearingPriceLabel) {
      this._drawClearingPriceLabel(renderingScope, lineX)
    }
  }

  /**
   * Renders the vertical dashed line at the calculated position
   */
  _renderClearingPriceLine(renderingScope: BitmapCoordinatesRenderingScope, lineX: number): void {
    const ctx = renderingScope.context
    const canvasHeight = renderingScope.bitmapSize.height

    ctx.save()
    ctx.strokeStyle = this._barColors.clearingPriceColor
    ctx.lineWidth = CLEARING_PRICE_LINE.WIDTH * renderingScope.horizontalPixelRatio
    ctx.setLineDash(CLEARING_PRICE_LINE.DASH_PATTERN.map((v) => v * renderingScope.horizontalPixelRatio))

    ctx.beginPath()
    ctx.moveTo(lineX, 0)
    ctx.lineTo(lineX, canvasHeight)
    ctx.stroke()
    ctx.restore()
  }

  /**
   * Draw a label above the clearing price line
   */
  _drawClearingPriceLabel(renderingScope: BitmapCoordinatesRenderingScope, lineX: number): void {
    if (!this._clearingPriceLabel) {
      return
    }

    const ctx = renderingScope.context
    const padding = 6 * renderingScope.horizontalPixelRatio
    const fontSize = 12 * renderingScope.verticalPixelRatio
    const offsetY = CLEARING_PRICE_LINE.LABEL_OFFSET_Y * renderingScope.verticalPixelRatio

    ctx.save()
    ctx.font = `${fontSize}px ${this._labelStyles.fontFamily}`
    ctx.textBaseline = 'top'
    ctx.textAlign = 'center'

    // Measure text to draw background
    const textMetrics = ctx.measureText(this._clearingPriceLabel)
    const textWidth = textMetrics.width
    const textHeight = fontSize

    // Draw background (same styling as hover tooltip but fully opaque)
    const bgX = lineX - textWidth / 2 - padding
    const bgY = offsetY
    const bgWidth = textWidth + padding * 2
    const bgHeight = textHeight + padding

    ctx.fillStyle = this._labelColors.background
    ctx.strokeStyle = this._labelColors.border
    ctx.lineWidth = 1
    ctx.beginPath()
    roundRect({ ctx, x: bgX, y: bgY, w: bgWidth, h: bgHeight, radii: 6 })
    ctx.fill()
    ctx.stroke()

    // Draw text (fully opaque)
    ctx.fillStyle = this._labelColors.text
    ctx.fillText(this._clearingPriceLabel, lineX, offsetY + padding / 2)

    ctx.restore()
  }

  /**
   * Draw concentration gradient behind bars to indicate the concentration band
   * Matches bars by tick value since the chart library filters the bars array
   */
  _drawConcentrationGradient(renderingScope: BitmapCoordinatesRenderingScope, bars: BarItem[]): void {
    if (!this._concentrationBand || !this._data) {
      return
    }

    const ctx = renderingScope.context
    const tickTolerance = this._tickSize * TOLERANCE.TICK_COMPARISON

    // Get concentration tick range from the band
    // We need to match bars by their tick values, not by array index
    // because the bars array here is filtered by the chart library
    const concentrationStartTick = this._data.bars.find(
      (b) =>
        b.originalData.tickValue !== undefined &&
        Math.abs(b.originalData.tickValue - this._concentrationBand!.startTick) < tickTolerance,
    )
    const concentrationEndTick = this._data.bars.find(
      (b) =>
        b.originalData.tickValue !== undefined &&
        Math.abs(b.originalData.tickValue - this._concentrationBand!.endTick) < tickTolerance,
    )

    if (!concentrationStartTick || !concentrationEndTick) {
      logger.warn('ToucanChartRenderer', '_drawConcentrationGradient', 'Could not find concentration start/end ticks', {
        startTick: this._concentrationBand.startTick,
        endTick: this._concentrationBand.endTick,
        availableTicks: this._data.bars.map((b) => b.originalData.tickValue),
      })
      return
    }

    // Validate that concentration band ticks are finite numbers
    if (!Number.isFinite(this._concentrationBand.startTick) || !Number.isFinite(this._concentrationBand.endTick)) {
      logger.warn(
        'ToucanChartRenderer',
        '_drawConcentrationGradient',
        'concentration band ticks are not finite numbers',
        {
          startTick: this._concentrationBand.startTick,
          endTick: this._concentrationBand.endTick,
          availableTicks: this._data.bars.map((b) => b.originalData.tickValue),
        },
      )
      return
    }

    // Find the leftmost and rightmost positions of bars within the concentration range
    let leftX: number | null = null
    let rightX: number | null = null

    const startTick = this._concentrationBand.startTick
    const endTick = this._concentrationBand.endTick
    const tolerance = this._tickSize * TOLERANCE.TICK_MATCHING

    // Iterate through all bars and find those within the tick range
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i]
      const tickValue = bar.tickValue

      // Check if this bar's tick is within the concentration range
      if (tickValue >= startTick - tolerance && tickValue <= endTick + tolerance) {
        const column = bar.column
        if (!column) {
          continue
        }

        if (leftX === null || column.left < leftX) {
          leftX = column.left
        }
        if (rightX === null || column.right > rightX) {
          rightX = column.right
        }
      }
    }

    // If we couldn't find valid positions, skip drawing
    if (leftX === null || rightX === null) {
      logger.debug(
        'ToucanChartRenderer',
        '_drawConcentrationGradient',
        'Could not find valid positions for concentration gradient',
      )
      return
    }

    // Get the actual canvas height in bitmap coordinates
    const canvasHeight = renderingScope.bitmapSize.height

    // Create vertical gradient from bottom to top
    // In canvas coordinates, y=0 is top, y=canvasHeight is bottom
    const gradient = ctx.createLinearGradient(0, canvasHeight, 0, 0)
    gradient.addColorStop(0, CONCENTRATION_GRADIENT.START_COLOR) // Bottom
    gradient.addColorStop(1, CONCENTRATION_GRADIENT.END_COLOR) // Top

    // Draw gradient rectangle spanning full height
    ctx.fillStyle = gradient
    ctx.fillRect(leftX, 0, rightX - leftX, canvasHeight)
  }
}
