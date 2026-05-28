import { useCallback, useEffect, useRef } from 'react'
import { BAR_STYLE } from '~/features/Toucan/Auction/BidDistributionChart/constants'
import type { ChartBarData, ProcessedChartData } from '~/features/Toucan/Auction/BidDistributionChart/utils/utils'

interface DistributionBarsOverlayProps {
  /** Processed chart bars (from generateChartData) */
  bars: ChartBarData[]
  /** Clearing price in decimal form (unscaled) */
  clearingPriceDecimal: number | undefined
  /** Concentration band from processed chart data */
  concentration: ProcessedChartData['concentration']
  /** Visible price range from clearing price chart Y-axis (in scaled space) */
  priceRange: { min: number; max: number }
  /** Scale factor to convert bar tick values to scaled space */
  scaleFactor: number
  /** Token color for bar coloring */
  tokenColor: string | undefined
  /** Fallback accent color when token color unavailable */
  fallbackAccentColor: string
  /** Neutral color for out-of-range bars */
  neutralColor: string
  /** Width of the overlay in pixels */
  width: number
  /** Height of the overlay in pixels */
  height: number
  /** Callback when hovering the overlay — always fires with y and tickPrice; bar is non-null when near a real bar */
  onBarHover?: ({ bar, y, tickPrice }: { bar: ChartBarData | null; y: number; tickPrice: number }) => void
  /** Callback when a bar is clicked (null when clicking empty space; tickPrice is the unscaled decimal price at click Y) */
  onBarClick?: (bar: ChartBarData | null, tickPrice: number) => void
}

const BAR_HEIGHT = 3
const BAR_SPACING = BAR_STYLE.SPACING
const BAR_BORDER_RADIUS = BAR_STYLE.BORDER_RADIUS
const HOVER_DIM_OPACITY = 0.4

/**
 * DistributionBarsOverlay renders horizontal distribution bars in a narrow column.
 * Bars grow leftward from the right edge. Y-axis is price (shared with clearing price chart).
 * This is a lightweight custom canvas component (~100 lines of draw logic).
 */
export function DistributionBarsOverlay({
  bars,
  clearingPriceDecimal,
  concentration,
  priceRange,
  scaleFactor,
  fallbackAccentColor,
  neutralColor,
  width,
  height,
  onBarHover,
  onBarClick,
}: DistributionBarsOverlayProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hoveredIndexRef = useRef<number | null>(null)
  const barHeightRef = useRef(BAR_HEIGHT)

  const priceToY = useCallback(
    (price: number): number => {
      const { min, max } = priceRange
      if (max === min) {
        return height / 2
      }
      // Price increases upward, Y increases downward
      return height - ((price - min) / (max - min)) * height
    },
    [priceRange, height],
  )

  const getBarColor = useCallback(
    (bar: ChartBarData): string => {
      // Inside concentration band → neutral2, outside → neutral3
      if (concentration) {
        if (bar.tick >= concentration.startTick && bar.tick <= concentration.endTick) {
          return fallbackAccentColor
        }
        return neutralColor
      }

      // Fallback when no concentration: above clearing → neutral2, below → neutral3
      if (clearingPriceDecimal !== undefined && bar.tick < clearingPriceDecimal) {
        return neutralColor
      }
      return fallbackAccentColor
    },
    [fallbackAccentColor, neutralColor, concentration, clearingPriceDecimal],
  )

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    if (bars.length === 0) {
      return
    }

    // Compute dynamic bar height from tick spacing so bars fill the space like the standalone chart.
    // Sort visible ticks by Y position and use the median gap between adjacent bars.
    const visibleYs: number[] = []
    let maxVolume = 0
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i]!
      if (bar.amount <= 0) {
        continue
      }
      const scaledTick = bar.tick * scaleFactor
      const y = priceToY(scaledTick)
      if (y >= -height && y <= height * 2) {
        maxVolume = Math.max(maxVolume, bar.amount)
        visibleYs.push(y)
      }
    }
    if (maxVolume === 0) {
      return
    }

    // Derive bar height from typical spacing between adjacent ticks
    visibleYs.sort((a, b) => a - b)
    let dynamicBarHeight = BAR_HEIGHT
    if (visibleYs.length >= 2) {
      const gaps: number[] = []
      for (let i = 1; i < visibleYs.length; i++) {
        gaps.push(Math.abs(visibleYs[i]! - visibleYs[i - 1]!))
      }
      gaps.sort((a, b) => a - b)
      // Use the smallest gap minus 1px so bars fill their slot with minimal separation
      const minGap = gaps[0]!
      dynamicBarHeight = Math.max(BAR_HEIGHT, minGap - BAR_SPACING)
    }
    // Cap at a reasonable maximum so bars don't get absurdly tall when zoomed in
    const barHeight = Math.min(dynamicBarHeight, height / 3)
    barHeightRef.current = barHeight

    // Linear scale so bar widths are proportional to volume
    const MIN_BAR_WIDTH = 2
    const scaleBarWidth = (amount: number): number => {
      if (maxVolume === 0) {
        return width
      }
      return Math.max(MIN_BAR_WIDTH, (amount / maxVolume) * width)
    }

    const hoveredIdx = hoveredIndexRef.current

    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i]!
      const scaledTick = bar.tick * scaleFactor
      const y = priceToY(scaledTick)

      // Skip bars outside visible range
      if (y < -barHeight || y > height + barHeight) {
        continue
      }

      if (bar.amount <= 0) {
        continue
      }
      const barWidth = scaleBarWidth(bar.amount)
      if (barWidth < 0.5) {
        continue
      }

      const x = width - barWidth
      const barY = y - barHeight / 2

      // Apply hover dimming
      const isHovered = hoveredIdx === i
      const isDimmed = hoveredIdx !== null && !isHovered

      ctx.globalAlpha = isDimmed ? HOVER_DIM_OPACITY : 1

      const color = getBarColor(bar)
      ctx.fillStyle = color

      // Draw rounded rect (left edge only, right edge flush)
      const r = Math.min(BAR_BORDER_RADIUS, barWidth / 2, barHeight / 2)
      ctx.beginPath()
      ctx.moveTo(x + r, barY)
      ctx.lineTo(x + barWidth, barY)
      ctx.lineTo(x + barWidth, barY + barHeight)
      ctx.lineTo(x + r, barY + barHeight)
      ctx.arcTo(x, barY + barHeight, x, barY + barHeight - r, r)
      ctx.lineTo(x, barY + r)
      ctx.arcTo(x, barY, x + r, barY, r)
      ctx.closePath()
      ctx.fill()
    }

    ctx.globalAlpha = 1
  }, [bars, priceToY, scaleFactor, getBarColor, width, height])

  // Redraw on state changes
  useEffect(() => {
    draw()
  }, [draw])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }

      const rect = canvas.getBoundingClientRect()
      const mouseY = e.clientY - rect.top

      // Compute tick price from Y position
      const { min, max } = priceRange
      const scaledPrice = min + ((height - mouseY) / height) * (max - min)
      const tickPrice = scaledPrice / scaleFactor

      // Find nearest bar
      let nearestIdx: number | null = null
      let nearestDist = Infinity

      for (let i = 0; i < bars.length; i++) {
        const bar = bars[i]!
        const scaledTick = bar.tick * scaleFactor
        const barY = priceToY(scaledTick)
        const dist = Math.abs(mouseY - barY)

        if (dist < nearestDist && dist < barHeightRef.current / 2 + BAR_SPACING) {
          nearestDist = dist
          nearestIdx = i
        }
      }

      if (nearestIdx !== hoveredIndexRef.current) {
        hoveredIndexRef.current = nearestIdx
        draw()
      }

      // Snap crosshair Y to the nearest bar's tick center so it jumps between ticks
      const snappedY = nearestIdx !== null ? priceToY(bars[nearestIdx]!.tick * scaleFactor) : mouseY
      onBarHover?.({ bar: nearestIdx !== null ? bars[nearestIdx]! : null, y: snappedY, tickPrice })
    },
    [bars, scaleFactor, priceToY, draw, onBarHover, priceRange, height],
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas || !onBarClick) {
        return
      }

      const rect = canvas.getBoundingClientRect()
      const mouseY = e.clientY - rect.top

      // Compute the unscaled decimal price at the click Y position
      const { min, max } = priceRange
      const scaledPrice = min + ((height - mouseY) / height) * (max - min)
      const tickPrice = scaledPrice / scaleFactor

      // Find nearest bar if any exist
      let nearestIdx: number | null = null
      let nearestDist = Infinity

      for (let i = 0; i < bars.length; i++) {
        const bar = bars[i]!
        const scaledTick = bar.tick * scaleFactor
        const barY = priceToY(scaledTick)
        const dist = Math.abs(mouseY - barY)

        if (dist < nearestDist && dist < barHeightRef.current / 2 + BAR_SPACING) {
          nearestDist = dist
          nearestIdx = i
        }
      }

      if (nearestIdx !== null) {
        onBarClick(bars[nearestIdx]!, tickPrice)
      } else {
        onBarClick(null, tickPrice)
      }
    },
    [bars, scaleFactor, priceToY, onBarClick, priceRange, height],
  )

  const handleMouseLeave = useCallback(() => {
    hoveredIndexRef.current = null
    draw()
    onBarHover?.({ bar: null, y: 0, tickPrice: 0 })
  }, [draw, onBarHover])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width, height, display: 'block', cursor: 'pointer' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    />
  )
}
