import { type ChartOptions, CrosshairMode, type DeepPartial, LineStyle, LineType } from 'lightweight-charts'
import { opacify } from 'ui/src/theme'
import { CHART_FONT_FAMILY, LABEL_CONFIG } from '~/features/Toucan/Auction/BidDistributionChart/constants'
import type { ClearingPriceChartControllerCreateParams } from '~/features/Toucan/ToucanChart/clearingPrice/types'

export function createClearingPriceChartOptions({
  width,
  height,
  colors,
}: {
  width: number
  height: number
  colors: ClearingPriceChartControllerCreateParams['colors']
}): DeepPartial<ChartOptions> {
  return {
    width,
    height,
    layout: {
      textColor: colors.neutral2.val,
      background: { color: 'transparent' },
      fontFamily: CHART_FONT_FAMILY,
      fontSize: LABEL_CONFIG.FONT_SIZE,
    },
    leftPriceScale: {
      visible: false,
      borderVisible: false,
      autoScale: true,
      // scaleMargins are applied via chart.priceScale('left').applyOptions in init.ts —
      // lightweight-charts only honors them reliably after the scale exists.
    },
    rightPriceScale: {
      visible: false,
    },
    timeScale: {
      // Fix edges to prevent auto-scrolling/panning
      fixLeftEdge: true,
      fixRightEdge: true,
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { visible: false },
    },
    crosshair: {
      mode: CrosshairMode.Magnet,
      horzLine: {
        visible: false,
        labelVisible: false,
      },
      vertLine: {
        visible: true,
        style: LineStyle.Dashed,
        width: 1,
        color: opacify(65, colors.neutral1.val),
        labelVisible: false,
      },
    },
    // Enable zoom/scroll interactions
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: false,
    },
    handleScale: {
      mouseWheel: true,
      pinch: true,
      axisPressedMouseMove: {
        time: true,
        price: false,
      },
    },
  }
}

export function createTimeScaleOptions({
  colors,
  timeSpanDays,
  useLogicalRangePositioning,
}: {
  colors: ClearingPriceChartControllerCreateParams['colors']
  timeSpanDays: number
  /** When true, allows right edge to extend beyond data (for blank space display) */
  useLogicalRangePositioning?: boolean
}): DeepPartial<ChartOptions['timeScale']> {
  return {
    visible: true,
    borderVisible: true,
    borderColor: colors.surface3.val,
    fixLeftEdge: true,
    // Allow right edge to extend beyond data when using logical range positioning
    fixRightEdge: !useLogicalRangePositioning,
    // Only show time (e.g., "11:15 PM") when data spans less than 1 day
    timeVisible: timeSpanDays < 1,
    secondsVisible: false,
  }
}

/**
 * Fill opacities (0-100) for the no-bids full-width state. The fill reads as a near-solid block
 * (only a subtle top→bottom falloff) so the horizontal right-edge fade — not a vertical one — is
 * the only fade the eye sees, per design (LP-806).
 */
const NO_BIDS_FILL_TOP_OPACITY = 28
const NO_BIDS_FILL_BOTTOM_OPACITY = 18

export function createAreaSeriesOptions({
  colors,
  tokenColor,
  scaledYMin,
  scaledYMax,
  solidAreaFill = false,
}: {
  colors: ClearingPriceChartControllerCreateParams['colors']
  tokenColor?: string
  scaledYMin: number
  scaledYMax: number
  /**
   * No-bids full-width state: render a vertically near-uniform fill instead of the default
   * top-opaque → bottom-transparent vertical gradient, so the fill fades only horizontally
   * toward the right edge (LP-806).
   */
  solidAreaFill?: boolean
}): Record<string, unknown> {
  const lineColor = tokenColor || colors.accent1.val

  // Enforce calculated scaled yMin/yMax range. Clamp minValue to 0 — prices are
  // non-negative by domain, and letting a small buffer push the floor negative
  // produces mirrored y-axis labels (see priceFormatter.ts). Bottom breathing room
  // comes from priceScale.scaleMargins, not from widening the data range.
  const autoscaleInfoProvider = () => ({
    priceRange: {
      minValue: Math.max(0, scaledYMin),
      maxValue: scaledYMax,
    },
  })

  return {
    priceLineVisible: false,
    lastValueVisible: false,
    lineType: LineType.WithSteps,
    lineWidth: 2,
    lineColor,
    topColor: solidAreaFill ? opacify(NO_BIDS_FILL_TOP_OPACITY, lineColor) : lineColor,
    bottomColor: solidAreaFill ? opacify(NO_BIDS_FILL_BOTTOM_OPACITY, lineColor) : opacify(0, colors.surface1.val),
    autoscaleInfoProvider,
    // Hide default crosshair marker - we use a custom marker
    crosshairMarkerRadius: 0,
  }
}
