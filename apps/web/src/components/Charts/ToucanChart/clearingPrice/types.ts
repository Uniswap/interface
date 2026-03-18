import type { UTCTimestamp } from 'lightweight-charts'
import type { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'
import type { BidTokenInfo } from '~/components/Toucan/Auction/store/types'

export interface ClearingPriceChartPoint {
  time: UTCTimestamp
  value: number
  q96: string
}

export interface ChartCoordinates {
  x: number
  y: number
}

/**
 * Normalized series data with computed metadata for chart rendering.
 */
export interface NormalizedClearingPriceSeries {
  /** Scaled data points for lightweight-charts (values multiplied by scaleFactor) */
  data: ClearingPriceChartPoint[]
  /** Original unscaled data points */
  originalData: ClearingPriceChartPoint[]
  /** Start time of the series */
  startTime: UTCTimestamp | undefined
  /** End time of the series */
  endTime: UTCTimestamp | undefined
  /** Minimum Y value (unscaled) */
  yMin: number
  /** Maximum Y value (unscaled) */
  yMax: number
  /** Minimum Y value after scaling */
  scaledYMin: number
  /** Maximum Y value after scaling */
  scaledYMax: number
  /** Scale factor applied to values for Y-axis display */
  scaleFactor: number
  /** Time span of the data in days (for x-axis format decisions) */
  timeSpanDays: number
  /** Visible range start time (auction start) for setting chart bounds */
  visibleRangeStart: UTCTimestamp | undefined
  /** Visible range end time (data end) for setting chart bounds */
  visibleRangeEnd: UTCTimestamp | undefined
  /** Whether the auction is currently in progress (not ended) */
  isAuctionInProgress: boolean
  /** Auction end time (for x-axis extension in in-progress auctions) */
  auctionEndTime: UTCTimestamp | undefined
}

export interface ClearingPriceZoomState {
  visibleRange: { from: number; to: number } | null
  isZoomed: boolean
}

/**
 * Callbacks from the controller to React layer for state synchronization.
 */
interface ClearingPriceChartControllerCallbacks {
  /** Called when tooltip data changes (hovered point or hide) */
  onTooltipStateChange: (state: ClearingPriceTooltipState | null) => void
  /** Called when hover coordinates change (hovered point or hide) */
  onHoverCoordinatesChange?: (coordinates: ChartCoordinates | null) => void
  /** Called when visible range / zoom state changes */
  onZoomStateChange?: (state: ClearingPriceZoomState) => void
}

export interface ClearingPriceChartControllerCreateParams {
  container: HTMLDivElement
  height: number
  colors: UseSporeColorsReturn
  tokenColor?: string
  bidTokenInfo: BidTokenInfo
  maxFractionDigits: number
  callbacks: ClearingPriceChartControllerCallbacks
}

export interface ClearingPriceChartControllerUpdateParams {
  /** Scaled chart data */
  data: ClearingPriceChartPoint[]
  /** Scaled Y-axis minimum */
  scaledYMin: number
  /** Scaled Y-axis maximum */
  scaledYMax: number
  /** Scale factor for value transformation */
  scaleFactor: number
  /** Bid token symbol for Y-axis formatting */
  bidTokenSymbol: string
  /** Maximum fraction digits for price formatting */
  maxFractionDigits: number
  /** Time span in days for x-axis format */
  timeSpanDays: number
  /** Visible range start time (auction start) for setting chart bounds */
  visibleRangeStart?: UTCTimestamp
  /** Visible range end time (data end) for setting chart bounds */
  visibleRangeEnd?: UTCTimestamp
  /** Full range start time for zoom bounds */
  fullRangeStart?: UTCTimestamp
  /** Full range end time for zoom bounds */
  fullRangeEnd?: UTCTimestamp
  /** Initial visible range start time for reset */
  initialRangeStart?: UTCTimestamp
  /** Initial visible range end time for reset */
  initialRangeEnd?: UTCTimestamp
  /** Token color for chart line styling */
  tokenColor?: string
  /**
   * Whether to use logical range positioning (75% visible data width).
   * When true, data is positioned at 75% of the chart with blank space on right.
   * This controls rendering behavior, not actual auction state.
   */
  useLogicalRangePositioning?: boolean
  /** Whether to hide the x-axis (when using two-chart overlay mode) */
  hideXAxis?: boolean
  /** Whether zoom/pan interactions are enabled */
  isZoomEnabled?: boolean
}

export interface ClearingPriceTooltipState {
  /** X position in pixels relative to chart container */
  x: number
  /** Y position in pixels relative to chart container */
  y: number
  /** Whether tooltip should appear on the left side of crosshair */
  flipLeft: boolean
  /** The hovered data point */
  data: ClearingPriceChartPoint
}
