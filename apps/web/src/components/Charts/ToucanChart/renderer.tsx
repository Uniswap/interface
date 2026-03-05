/* eslint-disable max-lines -- TODO(Toucan): split renderer into smaller modules */

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
import { roundRect } from '~/components/Charts/utils'
import { ColumnPosition, calculateColumnPositionsInPlace, positionsBox } from '~/components/Charts/VolumeChart/utils'
import {
  BAR_STYLE,
  BID_BAR_STRIPES,
  BID_LINE,
  CLEARING_PRICE_LINE,
  TOLERANCE,
} from '~/components/Toucan/Auction/BidDistributionChart/constants'
import { findBidLineXPosition } from '~/components/Toucan/Auction/BidDistributionChart/utils/bidLine/position'
import { findClearingPriceXPosition } from '~/components/Toucan/Auction/BidDistributionChart/utils/clearingPrice/position'

/**
 * Custom renderer for Toucan bid distribution chart
 * Simplified histogram renderer designed specifically for bid distribution display
 */

export interface ToucanChartData extends CustomData {
  value: number
  time: UTCTimestamp
  tickValue?: number
  tickQ96?: string // Original Q96 string for precise click handling
}

interface BarItem {
  x: number
  y: number
  column?: ColumnPosition
  tickValue: number // stored for bar coloring logic
}

export type ChartMode = 'distribution' | 'demand'

interface DemandBackgroundGradient {
  startColor: string // Top of gradient (darker)
  endColor: string // Bottom of gradient (nearly transparent)
}

export interface ToucanChartSeriesOptions extends CustomSeriesOptions {
  // Visual + scale configuration (controller-owned; allows updates without recreating chart)
  barColors: BarColors
  labelColors: LabelColors
  labelStyles: LabelStyles
  clearingPriceLineColors: ClearingPriceLineColors
  bidLineColors?: BidLineColors
  concentrationGradientColors?: ConcentrationGradientColors
  demandBackgroundGradient?: DemandBackgroundGradient // Full-width background for demand chart
  demandOutOfRangeBackgroundGradient?: DemandBackgroundGradient // Background for demand bars below clearing price
  demandBackgroundGapMaxTicks?: number // Remove background gaps when visible ticks exceed this count
  clearingPrice: number
  tickSize: number
  priceScaleFactor: number
  concentrationBand?: ConcentrationBand | null
  chartMode?: ChartMode // 'distribution' (default) or 'demand' (cumulative sum)

  // Interaction state
  hoveredTickValue?: number | null
  isHoveringClearingPrice?: boolean
  userBidPrice?: number | null // User's bid price (can be updated dynamically via applyOptions)
}

interface BarColors {
  clearingPriceColor: string // Pure token color for bars at clearing price tick
  concentrationColor: string // Token color + white overlay for bars in concentration band
  aboveClearingPriceColor: string // Pure token color for bars above concentration range
  belowClearingPriceColor: string // Neutral color for bars below clearing price
}

interface LabelColors {
  background: string
  border: string
  text: string
  subtitle: string
}

interface LabelStyles {
  fontFamily: string
}

interface ClearingPriceLineColors {
  gradientStart: string // rgba color for top of line (transparent end)
  gradientEnd: string // rgba color for bottom of line (visible end)
}

interface BidLineColors {
  gradientStart: string // rgba color for top of line (transparent end)
  gradientEnd: string // rgba color for bottom of line (visible end)
  dotFill: string // Fill color for the dot (typically white)
  dotBorder: string // Border color for the dot (matches line gradient end)
  stripeColor: string // Color for diagonal stripes on bid bar (typically white/neutral1)
}

interface ConcentrationGradientColors {
  startColor: string // rgba color for bottom of gradient (subtle)
  endColor: string // rgba color for top of gradient (stronger)
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
  clearingPriceLineColors: ClearingPriceLineColors // Theme-aware colors for clearing price line gradient
  bidLineColors?: BidLineColors // Theme-aware colors for bid line gradient
  concentrationGradientColors?: ConcentrationGradientColors // Token color-based gradient for concentration band background
  demandBackgroundGradient?: DemandBackgroundGradient // Full-width background for demand chart
  demandOutOfRangeBackgroundGradient?: DemandBackgroundGradient // Background for demand bars below clearing price
  demandBackgroundGapMaxTicks?: number // Remove background gaps when visible ticks exceed this count
  clearingPrice: number // Clearing price in fiat (for conditional bar styling)
  tickSize: number
  /**
   * Scaling factor applied to tick prices before they are passed to lightweight-charts as "time" values.
   *
   * Lightweight-charts expects strictly increasing integer timestamps. We reuse that axis for prices, so we
   * multiply each decimal price by this factor and round to the nearest integer. The factor must be large enough
   * that adjacent ticks map to distinct integers, otherwise the library throws an assertion about duplicate times.
   *
   * The renderer itself does not derive the factor; callers must ensure the same factor is used everywhere the
   * chart converts between price ↔ integer coordinates (series data, labels, clearing price line, etc.).
   */
  priceScaleFactor: number
  concentrationBand?: ConcentrationBand | null // Concentration band indices
  chartMode?: ChartMode // 'distribution' (default) or 'demand' (cumulative sum)
  userBidPrice?: number | null // User's bid price in decimal form (always on a tick)
}

export class ToucanChartSeriesRenderer implements ICustomSeriesPaneRenderer {
  _data: PaneRendererCustomData<Time, ToucanChartData> | null = null
  _options: ToucanChartSeriesOptions | null = null
  _userBidPrice?: number | null
  /**
   * When set to true, the renderer will ignore hoveredTickValue and isHoveringClearingPrice
   * from options and treat them as null/false. This is a workaround for lightweight-charts
   * caching options internally - we can't reset the cached value, but we can tell the
   * renderer to ignore it. Reset this flag after the next draw cycle.
   */
  _forceHoverReset = false
  /**
   * When set to true, the renderer will hide the bid line regardless of the userBidPrice
   * value in options. This is a workaround for lightweight-charts caching options internally.
   * Used when user switches away from the "Place a bid" tab.
   */
  _forceBidLineHide = false
  /**
   * Stores the last calculated clearing price X position in media (CSS) coordinates.
   * This is used to synchronize the DOM triangle overlay with the canvas-rendered line,
   * ensuring both use the exact same calculated position.
   */
  _lastClearingPriceXMedia: number | null = null
  /**
   * Stores the last calculated bid line X position in media (CSS) coordinates.
   * This is used to synchronize the DOM bid dot overlay with the canvas-rendered line,
   * ensuring both use the exact same calculated position.
   */
  _lastBidLineXMedia: number | null = null

  constructor(props: ToucanChartProps) {
    this._userBidPrice = props.userBidPrice
  }

  draw(target: CanvasRenderingTarget2D, priceConverter: PriceToCoordinateConverter): void {
    target.useBitmapCoordinateSpace((scope) => this._drawImpl(scope, priceConverter))
  }

  update(data: PaneRendererCustomData<Time, ToucanChartData>, options: ToucanChartSeriesOptions): void {
    this._data = data
    this._options = options
  }

  /**
   * Gets the effective user bid price, preferring dynamically updated options over constructor value
   * This allows the bid price to be updated without recreating the entire chart
   */
  _getEffectiveUserBidPrice(): number | null | undefined {
    // If force hide is active, return null to hide the bid line
    if (this._forceBidLineHide) {
      return null
    }
    // Prefer options value if explicitly set (even if null), otherwise fall back to constructor value
    if (this._options && 'userBidPrice' in this._options) {
      return this._options.userBidPrice
    }
    return this._userBidPrice
  }

  /**
   * Determines the fill color for a bar based on its tick value relative to clearing price
   * and whether it's within the concentration band
   *
   * Color logic per Figma design:
   * - Hovered bar: concentrationColor (token + white overlay)
   * - Non-hovered bars when hovering: same colors but with reduced opacity (handled by globalAlpha in draw)
   * - Bars in concentration band: concentrationColor (token + white overlay)
   * - Bars at clearing price tick: clearingPriceColor (pure token color)
   * - Bars above concentration range: aboveClearingPriceColor (pure token color)
   * - Bars below clearing price: belowClearingPriceColor (neutral3)
   *
   * For demand chart mode: simplified coloring with single token color for all bars
   */
  _getBarColor(tickValue: number): { color: string; shouldDim: boolean } {
    const tickSize = this._options?.tickSize ?? 0
    const tolerance = tickSize * TOLERANCE.TICK_COMPARISON
    const barColors = this._options?.barColors
    const clearingPrice = this._options?.clearingPrice ?? 0
    if (!barColors) {
      return { color: 'transparent', shouldDim: false }
    }

    // If force hover reset is active, ignore the cached hoveredTickValue
    const hoveredTick = this._forceHoverReset ? null : this._options?.hoveredTickValue
    const isHovering = hoveredTick != null && Number.isFinite(hoveredTick)
    const isThisBarHovered = isHovering && Math.abs(tickValue - hoveredTick) < tolerance

    // Hovered bar gets concentration color (token + white)
    if (isThisBarHovered) {
      return { color: barColors.concentrationColor, shouldDim: false }
    }

    // Demand chart mode: simplified coloring
    // Bars below clearing price use gray, bars at or above use token color
    if (this._options?.chartMode === 'demand') {
      if (tickValue < clearingPrice - tolerance) {
        return { color: barColors.belowClearingPriceColor, shouldDim: isHovering }
      }
      return { color: barColors.clearingPriceColor, shouldDim: isHovering }
    }

    const band = this._options?.concentrationBand
    const isInConcentration =
      band &&
      Number.isFinite(band.startTick) &&
      Number.isFinite(band.endTick) &&
      tickValue >= band.startTick - tolerance &&
      tickValue <= band.endTick + tolerance

    // Use tolerance-based comparison for clearing price (not direct equality)
    const isAtClearingPrice = Math.abs(tickValue - clearingPrice) < tolerance

    // Bars below clearing price
    if (tickValue < clearingPrice - tolerance) {
      return { color: barColors.belowClearingPriceColor, shouldDim: isHovering }
    }

    // Bars at clearing price tick
    if (isAtClearingPrice) {
      return { color: barColors.clearingPriceColor, shouldDim: isHovering }
    }

    // Bars in concentration band (above clearing price)
    if (isInConcentration) {
      return { color: barColors.concentrationColor, shouldDim: isHovering }
    }

    // Bars above concentration range
    return { color: barColors.aboveClearingPriceColor, shouldDim: isHovering }
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

    const visibleRange = this._data.visibleRange

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
      startIndex: Math.floor(visibleRange.from),
      endIndex: Math.ceil(visibleRange.to),
    })

    const zeroY = priceToCoordinate(0) ?? 0
    const start = Math.max(0, Math.floor(visibleRange.from))
    const end = Math.min(bars.length, Math.ceil(visibleRange.to))

    const isDemandMode = this._options.chartMode === 'demand'

    // Draw background gradient
    if (isDemandMode) {
      // Demand mode: draw per-bar background gradients with gaps
      this._drawDemandBackground({ renderingScope, bars, start, end })
    } else {
      // Distribution mode: draw concentration gradient only when the band is valid.
      // Note: `concentrationBand` is always an object (never null) due to lightweight-charts deep-merge behavior.
      const band = this._options.concentrationBand
      if (band && Number.isFinite(band.startTick) && Number.isFinite(band.endTick)) {
        this._drawConcentrationGradient(renderingScope, bars)
      }
    }

    // Draw clearing price line if clearing price is available
    this._drawClearingPriceLine({ renderingScope, bars, zeroY })

    // Check if this bar is at the user's bid tick (for special highlighting)
    const tolerance = this._options.tickSize * TOLERANCE.TICK_COMPARISON
    const effectiveUserBidPrice = this._getEffectiveUserBidPrice()

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

      // Demand mode uses 2px spacing between bars, distribution uses 1px
      const barSpacing = isDemandMode ? 2 : BAR_STYLE.SPACING
      const xMargin = barSpacing * renderingScope.horizontalPixelRatio

      // Calculate final bar width after margin, ensuring minimum 1px width
      const barWidth = Math.max(renderingScope.horizontalPixelRatio, width - xMargin)

      const barBox = positionsBox({
        position1Media: zeroY,
        position2Media: bar.y,
        pixelRatio: renderingScope.verticalPixelRatio,
      })

      // Check if this bar is at the user's bid price
      const isUserBidBar =
        effectiveUserBidPrice != null &&
        this._options.bidLineColors &&
        barBox.length > 0 && // Only highlight if there's volume at this tick
        Math.abs(bar.tickValue - effectiveUserBidPrice) < tolerance

      // Determine bar color - use concentration color (lighter) for user bid bar
      let barColor: string
      let shouldDim = false
      if (isUserBidBar) {
        // Use the concentration color (token + white overlay) for user bid bar
        barColor = this._options.barColors.concentrationColor
      } else {
        const barColorInfo = this._getBarColor(bar.tickValue)
        barColor = barColorInfo.color
        shouldDim = barColorInfo.shouldDim
      }

      // Draw bar with conditional color and opacity
      // When hovering, non-hovered bars should be dimmed (40% opacity)
      ctx.fillStyle = barColor
      ctx.globalAlpha = shouldDim ? 0.4 : 1

      roundRect({
        ctx,
        x: column.left + xMargin,
        y: barBox.position,
        w: barWidth,
        h: barBox.length,
        radii: BAR_STYLE.BORDER_RADIUS,
      })

      // Draw diagonal stripes on user bid bar
      if (isUserBidBar && this._options.bidLineColors) {
        this._drawBarStripes({
          ctx,
          x: column.left + xMargin,
          y: barBox.position,
          width: barWidth,
          height: barBox.length,
        })
      }

      ctx.globalAlpha = 1
    }

    // Draw user bid line AFTER bars so it renders on top
    if (effectiveUserBidPrice != null && this._options.bidLineColors) {
      this._drawBidLine({ renderingScope, bars, zeroY, userBidPrice: effectiveUserBidPrice })
    }
  }

  /**
   * Draw a vertical line at the clearing price position with optional label
   */
  _drawClearingPriceLine(params: {
    renderingScope: BitmapCoordinatesRenderingScope
    bars: BarItem[]
    zeroY: number
  }): void {
    const { renderingScope, bars, zeroY } = params
    if (!this._data || !this._options?.tickSize) {
      return
    }

    // Use pure utility function to calculate line position
    const lineX = findClearingPriceXPosition({
      clearingPrice: this._options.clearingPrice,
      bars,
      priceScaleFactor: this._options.priceScaleFactor,
    })

    if (lineX === null) {
      this._lastClearingPriceXMedia = null
      return
    }

    // Store the position in media (CSS) coordinates for use by DOM overlays.
    // This ensures the triangle overlay uses the exact same position as the canvas line.
    this._lastClearingPriceXMedia = lineX / renderingScope.horizontalPixelRatio

    // Render the line
    this._renderClearingPriceLine({ renderingScope, lineX, bars, zeroY })
  }

  /**
   * Renders the vertical dashed line at the calculated position
   */
  _renderClearingPriceLine(params: {
    renderingScope: BitmapCoordinatesRenderingScope
    lineX: number
    bars: BarItem[]
    zeroY: number
  }): void {
    const { renderingScope, lineX, bars, zeroY } = params
    const ctx = renderingScope.context
    const canvasHeight = renderingScope.bitmapSize.height
    const pixelRatio = renderingScope.horizontalPixelRatio

    // Find overlapping bar where the line intersects horizontally
    // The bars array has column information populated from the previous calculateColumnPositionsInPlace call
    const overlappingBar = bars.find((bar) => {
      if (!bar.column) {
        return false
      }

      // Check if lineX falls within the bar's horizontal bounds
      // We add a small tolerance to ensure we catch edge cases
      // bar.column.left and .right are in bitmap coordinates
      // Only consider it overlapping if the line is strictly inside the bar column (or touches edges)
      return lineX >= bar.column.left && lineX <= bar.column.right && Math.abs(bar.y - zeroY) > 1
    })

    // Determine line bottom position
    // If overlapping bar, line stops at bar top (bar.y)
    // Otherwise, line goes to bottom of canvas
    let lineBottom = canvasHeight
    if (overlappingBar) {
      const barBox = positionsBox({
        position1Media: zeroY,
        position2Media: overlappingBar.y,
        pixelRatio: renderingScope.verticalPixelRatio,
      })
      // barBox.position is the top-most coordinate of the bar in bitmap space
      lineBottom = barBox.position - 2 * renderingScope.verticalPixelRatio
    }

    ctx.save()

    // Create gradient using theme-aware colors
    const gradient = ctx.createLinearGradient(0, 0, 0, lineBottom)
    gradient.addColorStop(0, this._options?.clearingPriceLineColors.gradientStart ?? 'transparent')
    gradient.addColorStop(1, this._options?.clearingPriceLineColors.gradientEnd ?? 'transparent')

    ctx.strokeStyle = gradient
    ctx.lineWidth = CLEARING_PRICE_LINE.WIDTH * pixelRatio
    ctx.setLineDash(CLEARING_PRICE_LINE.DASH_PATTERN.map((v) => v * pixelRatio))

    ctx.beginPath()
    ctx.moveTo(lineX, 0)
    ctx.lineTo(lineX, lineBottom)
    ctx.stroke()
    ctx.restore()
  }

  /**
   * Draw concentration gradient behind bars to indicate the concentration band
   * Matches bars by tick value since the chart library filters the bars array
   */
  _drawConcentrationGradient(renderingScope: BitmapCoordinatesRenderingScope, bars: BarItem[]): void {
    if (!this._options?.concentrationBand || !this._data) {
      return
    }

    const ctx = renderingScope.context

    // Validate that concentration band ticks are finite numbers
    if (
      !Number.isFinite(this._options.concentrationBand.startTick) ||
      !Number.isFinite(this._options.concentrationBand.endTick)
    ) {
      logger.warn(
        'ToucanChartRenderer',
        '_drawConcentrationGradient',
        'concentration band ticks are not finite numbers',
        {
          startTick: this._options.concentrationBand.startTick,
          endTick: this._options.concentrationBand.endTick,
        },
      )
      return
    }

    // Find the leftmost and rightmost positions of bars within the concentration range
    let leftX: number | null = null
    let rightX: number | null = null

    const startTick = this._options.concentrationBand.startTick
    const endTick = this._options.concentrationBand.endTick
    const tolerance = this._options.tickSize * TOLERANCE.TICK_MATCHING

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

    // Apply the same xMargin that bars use for consistent alignment
    const xMargin = BAR_STYLE.SPACING * renderingScope.horizontalPixelRatio

    // Use dynamic gradient colors from options (based on token color)
    // If not provided, skip drawing the gradient
    const gradientColors = this._options.concentrationGradientColors
    if (!gradientColors) {
      return
    }

    // Create vertical gradient from bottom to top
    // In canvas coordinates, y=0 is top, y=canvasHeight is bottom
    const gradient = ctx.createLinearGradient(0, canvasHeight, 0, 0)
    gradient.addColorStop(0, gradientColors.startColor) // Bottom
    gradient.addColorStop(1, gradientColors.endColor) // Top

    // Draw gradient rectangle spanning full height
    // Adjust by xMargin to align with bar positions (bars start at column.left + xMargin)
    ctx.fillStyle = gradient
    ctx.fillRect(leftX + xMargin, 0, rightX - leftX - xMargin, canvasHeight)
  }

  /**
   * Draw per-bar background gradients for demand chart mode.
   * Each bar gets its own gradient column with gaps between them,
   * matching the bar spacing for visual consistency with the Figma design.
   */
  _drawDemandBackground({
    renderingScope,
    bars,
    start,
    end,
  }: {
    renderingScope: BitmapCoordinatesRenderingScope
    bars: BarItem[]
    start: number
    end: number
  }): void {
    if (!this._options?.demandBackgroundGradient || !this._data) {
      return
    }

    const ctx = renderingScope.context
    const { height } = renderingScope.bitmapSize
    const gradientColors = this._options.demandBackgroundGradient
    const outOfRangeGradientColors = this._options.demandOutOfRangeBackgroundGradient ?? gradientColors
    const clearingPrice = this._options.clearingPrice
    const tickSize = this._options.tickSize
    const tolerance = tickSize * TOLERANCE.TICK_COMPARISON

    // Demand mode uses 2px spacing between bars
    const barSpacing = 2
    const visibleCount = end - start
    const gapMaxTicks = this._options.demandBackgroundGapMaxTicks
    const shouldRemoveGaps = gapMaxTicks != null && visibleCount >= gapMaxTicks
    const xMargin = shouldRemoveGaps ? 0 : barSpacing * renderingScope.horizontalPixelRatio

    // Create vertical gradients once (reuse for all bars since colors are the same)
    const inRangeGradient = ctx.createLinearGradient(0, 0, 0, height)
    inRangeGradient.addColorStop(0, gradientColors.startColor) // Top (darker)
    inRangeGradient.addColorStop(1, gradientColors.endColor) // Bottom (nearly transparent)

    const useSameGradient = outOfRangeGradientColors === gradientColors
    const outOfRangeGradient = useSameGradient
      ? inRangeGradient
      : (() => {
          const gradient = ctx.createLinearGradient(0, 0, 0, height)
          gradient.addColorStop(0, outOfRangeGradientColors.startColor)
          gradient.addColorStop(1, outOfRangeGradientColors.endColor)
          return gradient
        })()

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
      const barWidth = Math.max(renderingScope.horizontalPixelRatio, width - xMargin)

      const isOutOfRange = bar.tickValue < clearingPrice - tolerance
      ctx.fillStyle = isOutOfRange ? outOfRangeGradient : inRangeGradient

      // Draw gradient column with rounded corners matching bar style
      roundRect({
        ctx,
        x: column.left + xMargin,
        y: 0,
        w: barWidth,
        h: height,
        radii: BAR_STYLE.BORDER_RADIUS,
      })
    }
  }

  /**
   * Draw a vertical line at the user's bid price position with a white dot at the bottom
   * Similar to clearing price line but:
   * - Solid line (not dashed)
   * - White dot at bottom instead of arrow
   * - Always positioned on a tick
   */
  _drawBidLine(params: {
    renderingScope: BitmapCoordinatesRenderingScope
    bars: BarItem[]
    zeroY: number
    userBidPrice: number
  }): void {
    const { renderingScope, bars, userBidPrice } = params
    if (!this._data || !this._options?.bidLineColors) {
      return
    }

    const canvasWidth = renderingScope.bitmapSize.width

    // Find the X position for the bid line, passing canvas bounds for edge detection
    // This handles the case where a bar is partially visible but its center is off-screen
    const positionResult = findBidLineXPosition({
      bidPrice: userBidPrice,
      bars,
      canvasBounds: { width: canvasWidth },
    })

    // Only draw if the bid is fully visible in the current range
    // Don't draw for: above_range, below_range, not_found, or outside_canvas
    // The outside_canvas status indicates the tick exists but its center is off-screen
    // (e.g., when the bar is partially rendered due to zooming/panning)
    if (positionResult.status !== 'visible' || positionResult.x === null) {
      this._lastBidLineXMedia = null
      return
    }

    // Store the position in media (CSS) coordinates for use by DOM overlays (bid dot).
    // This ensures the dot uses the exact same position as the canvas line.
    // Note: We also apply BID_LINE.X_OFFSET here to match what _renderBidLine does.
    const pixelRatio = renderingScope.horizontalPixelRatio
    this._lastBidLineXMedia = (positionResult.x + BID_LINE.X_OFFSET * pixelRatio) / pixelRatio

    this._renderBidLine(renderingScope, positionResult.x)
  }

  /**
   * Renders the vertical solid line at the calculated position with a white dot at the bottom
   * Unlike clearing price line, the bid line extends all the way to the bottom of the chart
   */
  _renderBidLine(renderingScope: BitmapCoordinatesRenderingScope, lineX: number): void {
    if (!this._options?.bidLineColors) {
      return
    }

    const ctx = renderingScope.context
    const canvasHeight = renderingScope.bitmapSize.height
    const pixelRatio = renderingScope.horizontalPixelRatio

    // Bid line always goes to the bottom of the chart (through any overlapping bars)
    const lineBottom = canvasHeight

    // Apply X offset for better alignment with bar center
    const offsetLineX = lineX + BID_LINE.X_OFFSET * pixelRatio

    ctx.save()

    // Create gradient using theme-aware colors (same gradient style as clearing price)
    const gradient = ctx.createLinearGradient(0, 0, 0, lineBottom)
    gradient.addColorStop(0, this._options.bidLineColors.gradientStart)
    gradient.addColorStop(1, this._options.bidLineColors.gradientEnd)

    ctx.strokeStyle = gradient
    ctx.lineWidth = BID_LINE.WIDTH * pixelRatio
    // No dash pattern - solid line

    ctx.beginPath()
    ctx.moveTo(offsetLineX, 0)
    ctx.lineTo(offsetLineX, lineBottom)
    ctx.stroke()

    // Note: The dot is rendered via DOM in BidDistributionChartRenderer for better positioning
    // below the canvas area (similar to clearing price arrow)

    ctx.restore()
  }

  /**
   * Draws diagonal stripes pattern on a bar (used for user bid bar highlight)
   * Creates a hatched pattern effect with white lines at 45 degrees
   */
  _drawBarStripes(params: {
    ctx: CanvasRenderingContext2D
    x: number
    y: number
    width: number
    height: number
  }): void {
    const { ctx, x, y, width, height } = params
    if (!this._options?.bidLineColors) {
      return
    }

    ctx.save()

    // Create a clipping region for the bar (rounded rect)
    ctx.beginPath()
    const radius = Math.min(BAR_STYLE.BORDER_RADIUS, width / 2, height / 2)
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    ctx.clip()

    // Draw diagonal lines
    ctx.strokeStyle = this._options.bidLineColors.stripeColor
    ctx.lineWidth = BID_BAR_STRIPES.WIDTH
    ctx.globalAlpha = BID_BAR_STRIPES.OPACITY

    const spacing = BID_BAR_STRIPES.SPACING

    // Draw lines from bottom-left to top-right (45 degree angle)
    // We need to cover from -height to width to ensure full coverage
    const startOffset = -height
    const endOffset = width + height

    for (let offset = startOffset; offset < endOffset; offset += spacing) {
      ctx.beginPath()
      // Line starts at (x + offset, y + height) and goes to (x + offset + height, y)
      ctx.moveTo(x + offset, y + height)
      ctx.lineTo(x + offset + height, y)
      ctx.stroke()
    }

    ctx.restore()
  }
}
