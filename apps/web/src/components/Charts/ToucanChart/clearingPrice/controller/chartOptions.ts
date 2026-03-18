import { type ChartOptions, CrosshairMode, type DeepPartial, LineStyle, LineType } from 'lightweight-charts'
import { opacify } from 'ui/src/theme'
import type { ClearingPriceChartControllerCreateParams } from '~/components/Charts/ToucanChart/clearingPrice/types'
import {
  CHART_DIMENSIONS,
  CHART_FONT_FAMILY,
  LABEL_CONFIG,
} from '~/components/Toucan/Auction/BidDistributionChart/constants'

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
      visible: true,
      borderVisible: false,
      minimumWidth: CHART_DIMENSIONS.Y_AXIS_MIN_WIDTH,
      autoScale: true,
      entireTextOnly: true,
      scaleMargins: {
        top: 0.15,
        // No bottom margin - the autoscaleInfoProvider on the series constrains yMin to scaledYMin
        bottom: 0,
      },
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

export function createAreaSeriesOptions({
  colors,
  tokenColor,
  scaledYMin,
  scaledYMax,
}: {
  colors: ClearingPriceChartControllerCreateParams['colors']
  tokenColor?: string
  scaledYMin: number
  scaledYMax: number
}): Record<string, unknown> {
  const lineColor = tokenColor || colors.accent1.val

  // Custom autoscale provider that enforces calculated scaled yMin/yMax range
  // Uses scaledYMin to ensure line stays within visible Y-axis area
  const autoscaleInfoProvider = () => ({
    priceRange: {
      minValue: scaledYMin,
      maxValue: scaledYMax,
    },
  })

  return {
    priceLineVisible: false,
    lastValueVisible: false,
    lineType: LineType.WithSteps,
    lineWidth: 2,
    lineColor,
    topColor: lineColor,
    bottomColor: opacify(0, colors.surface1.val),
    autoscaleInfoProvider,
    // Hide default crosshair marker - we use a custom marker
    crosshairMarkerRadius: 0,
  }
}
