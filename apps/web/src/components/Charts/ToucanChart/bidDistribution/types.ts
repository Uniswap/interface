import type { IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts'
import type { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'
import type { ChartMode, ToucanChartData, ToucanChartSeriesOptions } from '~/components/Charts/ToucanChart/renderer'
import type { BidConcentrationResult } from '~/components/Toucan/Auction/BidDistributionChart/utils/bidConcentration'
import type { BidTokenInfo, UserBid } from '~/components/Toucan/Auction/store/types'

export interface ToucanBidLineTooltipState {
  left: number
  top: number
  isVisible: boolean
  volumeAtTick: number
  volumePercent: number
  flipLeft: boolean
}

export interface ToucanClearingPriceTooltipState {
  left: number
  top: number
  isVisible: boolean
  clearingPriceDecimal: number
  volumeAtClearingPrice: number
  totalBidVolume: number
}

export interface ToucanChartBarTooltipState {
  left: number
  top: number
  isVisible: boolean
  tickValue: number
  volumeAmount: number
  totalVolume: number
}

export interface ToucanBidDistributionChartZoomState {
  visibleRange: { from: number; to: number } | null
  isZoomed: boolean
}

interface ToucanBidDistributionChartControllerCallbacks {
  /** Fired when a user selects a tick (click on bar / x-axis area). */
  onSelectedTickPrice: (tickPriceDecimalString: string) => void
  /** Fired whenever the chart's zoom/pan visible range changes meaningfully. */
  onZoomStateChange: (state: ToucanBidDistributionChartZoomState) => void
  /** Fired when overlays that depend on layout/visible range should be refreshed. */
  onRequestOverlayUpdate: () => void
  /** Fired when the React-level marker overlay should recompute screen positions. */
  onRequestMarkerPositionsUpdate: () => void
  /** Fired when the React-level bid-line tooltip should update its position/visibility. */
  onBidLineTooltipStateChange: (state: ToucanBidLineTooltipState) => void
  /** Fired when the React-level clearing price tooltip should update its position/visibility. */
  onClearingPriceTooltipStateChange: (state: ToucanClearingPriceTooltipState) => void
  /** Fired when the React-level chart bar tooltip (hover) should update its position/visibility. */
  onChartBarTooltipStateChange: (state: ToucanChartBarTooltipState) => void
  /** Fired when hover state needs to be reset (e.g., mouse leaves chart). */
  onResetHoverState?: () => void
  /** Fired when a click occurs near the clearing price line, to trigger tooltip stacking. */
  onClickNearClearingPrice?: () => void
  /** Fired when user clicks out-of-range indicator and chart needs to extend to show their bid. */
  onExtendRangeRequired?: (bidTickDecimal: number) => void
}

export interface ToucanBidDistributionChartControllerCreateParams {
  container: HTMLDivElement
  height: number
  colors: UseSporeColorsReturn
  tokenColor?: string
  chartMode?: ChartMode
  /** Formatting for the y-axis (bid volume). */
  formatYAxisLabel: (amount: number) => string
  /** Formatting for FDV values shown in tooltips/labels. */
  formatFdvValue: (amount: number) => string
  /** Render custom x-axis labels into the provided layer element. */
  renderLabels: (params: {
    labelsLayer: HTMLDivElement
    chart: IChartApi
    plotLeft: number
    plotWidth: number
    priceScaleFactor: number
  }) => void
  /** i18n string for out-of-range "Your bid" label. */
  bidOutOfRangeLabel: string
  /** i18n suffix for FDV label (e.g. "FDV"). */
  fdvLabel: string
  callbacks: ToucanBidDistributionChartControllerCallbacks
}

export interface ToucanBidDistributionChartControllerUpdateParams {
  // Core dataset / scale params
  histogramData: ToucanChartData[]
  barsForMarkers: { tick: number; amount: number }[]
  minTick: number
  maxTick: number
  tickSizeDecimal: number
  clearingPriceDecimal: number
  clearingPriceBigInt: bigint | null
  priceScaleFactor: number
  rangePaddingUnits: number
  totalBidVolume: number

  // Domain data needed for click snapping + tooltip display
  bidTokenInfo: BidTokenInfo
  totalSupply?: string
  auctionTokenDecimals: number
  floorPriceQ96: string
  clearingPriceQ96: string
  tickSizeQ96: string

  // State coming from store / React
  chartZoomState: ToucanBidDistributionChartZoomState
  userBidPriceDecimal: number | null
  concentration: BidConcentrationResult | null
  userBids: UserBid[]
  connectedWalletAddress?: string

  // These are exposed for integration with existing hooks/overlays
  seriesOptionsPatch?: Partial<ToucanChartSeriesOptions>

  /** When false, zooming/scaling gestures are disabled (panning remains enabled). */
  isZoomEnabled: boolean

  /** When true, resets hover state before applying data. Used when mouse leaves the chart. */
  shouldResetHoverState?: boolean

  // When true, forces the chart to re-initialize its visible range (fitContent + setVisibleRange).
  // Used when switching to grouped mode to reset to the initial zoom.
  forceInitialZoom?: boolean
}

export interface ToucanBidDistributionChartControllerRefs {
  chart: IChartApi | null
  series: ISeriesApi<'Custom'> | null
  minTime: UTCTimestamp | null
  maxTime: UTCTimestamp | null
}
