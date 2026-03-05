import type {
  ToucanBidDistributionChartControllerUpdateParams,
  ToucanBidLineTooltipState,
  ToucanChartBarTooltipState,
  ToucanClearingPriceTooltipState,
} from '~/components/Charts/ToucanChart/bidDistribution/types'
import type { ToucanChartData } from '~/components/Charts/ToucanChart/renderer'
import type { ProcessedChartData } from '~/components/Toucan/Auction/BidDistributionChart/utils/utils'
import type { BidTokenInfo, UserBid } from '~/components/Toucan/Auction/store/types'

const areHistogramDataEqual = (left: ToucanChartData[], right: ToucanChartData[]): boolean => {
  if (left === right) {
    return true
  }
  if (left.length !== right.length) {
    return false
  }
  for (let i = 0; i < left.length; i++) {
    const leftItem = left[i]
    const rightItem = right[i]
    if (
      leftItem.time !== rightItem.time ||
      leftItem.value !== rightItem.value ||
      leftItem.tickValue !== rightItem.tickValue ||
      leftItem.tickQ96 !== rightItem.tickQ96
    ) {
      return false
    }
  }
  return true
}

const areBarsForMarkersEqual = (
  left: ToucanBidDistributionChartControllerUpdateParams['barsForMarkers'],
  right: ToucanBidDistributionChartControllerUpdateParams['barsForMarkers'],
): boolean => {
  if (left === right) {
    return true
  }
  if (left.length !== right.length) {
    return false
  }
  for (let i = 0; i < left.length; i++) {
    if (left[i].tick !== right[i].tick || left[i].amount !== right[i].amount) {
      return false
    }
  }
  return true
}

const areZoomStatesEqual = (
  left: ToucanBidDistributionChartControllerUpdateParams['chartZoomState'],
  right: ToucanBidDistributionChartControllerUpdateParams['chartZoomState'],
): boolean => {
  if (left === right) {
    return true
  }
  if (left.isZoomed !== right.isZoomed) {
    return false
  }
  if (left.visibleRange === null || right.visibleRange === null) {
    return left.visibleRange === right.visibleRange
  }
  return left.visibleRange.from === right.visibleRange.from && left.visibleRange.to === right.visibleRange.to
}

const areBidTokenInfoEqual = (left: BidTokenInfo, right: BidTokenInfo): boolean => {
  return left.symbol === right.symbol && left.decimals === right.decimals && left.priceFiat === right.priceFiat
}

const areConcentrationEqual = (
  left: ToucanBidDistributionChartControllerUpdateParams['concentration'],
  right: ToucanBidDistributionChartControllerUpdateParams['concentration'],
): boolean => {
  if (left === right) {
    return true
  }
  if (!left || !right) {
    return false
  }
  return (
    left.startIndex === right.startIndex &&
    left.endIndex === right.endIndex &&
    left.startTick === right.startTick &&
    left.endTick === right.endTick
  )
}

const areSeriesOptionsPatchesEqual = (
  left: ToucanBidDistributionChartControllerUpdateParams['seriesOptionsPatch'],
  right: ToucanBidDistributionChartControllerUpdateParams['seriesOptionsPatch'],
): boolean => {
  if (left === right) {
    return true
  }
  if (!left || !right) {
    return false
  }
  if (left.chartMode !== right.chartMode) {
    return false
  }
  const leftGradient = left.demandBackgroundGradient
  const rightGradient = right.demandBackgroundGradient
  if (!leftGradient || !rightGradient) {
    return leftGradient === rightGradient
  }
  return leftGradient.startColor === rightGradient.startColor && leftGradient.endColor === rightGradient.endColor
}

export const areUpdateParamsEqual = (
  left: ToucanBidDistributionChartControllerUpdateParams,
  right: ToucanBidDistributionChartControllerUpdateParams,
): boolean => {
  return (
    areHistogramDataEqual(left.histogramData, right.histogramData) &&
    areBarsForMarkersEqual(left.barsForMarkers, right.barsForMarkers) &&
    left.minTick === right.minTick &&
    left.maxTick === right.maxTick &&
    left.tickSizeDecimal === right.tickSizeDecimal &&
    left.clearingPriceDecimal === right.clearingPriceDecimal &&
    left.clearingPriceBigInt === right.clearingPriceBigInt &&
    left.priceScaleFactor === right.priceScaleFactor &&
    left.rangePaddingUnits === right.rangePaddingUnits &&
    left.totalBidVolume === right.totalBidVolume &&
    areBidTokenInfoEqual(left.bidTokenInfo, right.bidTokenInfo) &&
    left.totalSupply === right.totalSupply &&
    left.auctionTokenDecimals === right.auctionTokenDecimals &&
    left.floorPriceQ96 === right.floorPriceQ96 &&
    left.clearingPriceQ96 === right.clearingPriceQ96 &&
    left.tickSizeQ96 === right.tickSizeQ96 &&
    areZoomStatesEqual(left.chartZoomState, right.chartZoomState) &&
    left.userBidPriceDecimal === right.userBidPriceDecimal &&
    areConcentrationEqual(left.concentration, right.concentration) &&
    left.isZoomEnabled === right.isZoomEnabled &&
    areSeriesOptionsPatchesEqual(left.seriesOptionsPatch, right.seriesOptionsPatch)
  )
}

/**
 * Compares two UserBid arrays for content equality.
 * Compares all fields that would affect rendering or behavior.
 * IMPORTANT: Arrays must be sorted by bidId before comparison for consistent results.
 */
export const areUserBidsEqual = (left: UserBid[], right: UserBid[]): boolean => {
  if (left === right) {
    return true
  }
  if (left.length !== right.length) {
    return false
  }
  for (let i = 0; i < left.length; i++) {
    const leftBid = left[i]
    const rightBid = right[i]
    if (
      leftBid.bidId !== rightBid.bidId ||
      leftBid.status !== rightBid.status ||
      leftBid.maxPrice !== rightBid.maxPrice ||
      leftBid.amount !== rightBid.amount ||
      leftBid.baseTokenInitial !== rightBid.baseTokenInitial ||
      leftBid.createdAt !== rightBid.createdAt ||
      leftBid.walletId !== rightBid.walletId
    ) {
      return false
    }
  }
  return true
}

/**
 * Sorts UserBid array by bidId for consistent comparison.
 */
export const sortUserBidsById = (bids: UserBid[]): UserBid[] => {
  return [...bids].sort((left, right) => left.bidId.localeCompare(right.bidId))
}

/**
 * Compares two UserBid arrays for equality, sorting by bidId first.
 * Use this when bid order from the source may vary.
 */
export const areUserBidsEqualUnordered = (left: UserBid[], right: UserBid[]): boolean => {
  if (left === right) {
    return true
  }
  if (left.length !== right.length) {
    return false
  }
  return areUserBidsEqual(sortUserBidsById(left), sortUserBidsById(right))
}

const areProcessedChartDataEqual = (left: ProcessedChartData, right: ProcessedChartData): boolean => {
  if (left === right) {
    return true
  }
  if (
    left.minTick !== right.minTick ||
    left.maxTick !== right.maxTick ||
    left.maxAmount !== right.maxAmount ||
    left.totalBidVolume !== right.totalBidVolume ||
    left.labelIncrement !== right.labelIncrement
  ) {
    return false
  }
  if (left.yAxisLevels.length !== right.yAxisLevels.length) {
    return false
  }
  for (let i = 0; i < left.yAxisLevels.length; i++) {
    if (left.yAxisLevels[i] !== right.yAxisLevels[i]) {
      return false
    }
  }
  if (!areConcentrationEqual(left.concentration, right.concentration)) {
    return false
  }
  if (left.bars.length !== right.bars.length) {
    return false
  }
  for (let i = 0; i < left.bars.length; i++) {
    const leftBar = left.bars[i]
    const rightBar = right.bars[i]
    if (
      leftBar.tick !== rightBar.tick ||
      leftBar.tickQ96 !== rightBar.tickQ96 ||
      leftBar.amount !== rightBar.amount ||
      leftBar.index !== rightBar.index
    ) {
      return false
    }
  }
  return true
}

export const areBidLineTooltipStatesEqual = (
  left: ToucanBidLineTooltipState,
  right: ToucanBidLineTooltipState,
): boolean =>
  left.left === right.left &&
  left.top === right.top &&
  left.isVisible === right.isVisible &&
  left.volumeAtTick === right.volumeAtTick &&
  left.volumePercent === right.volumePercent &&
  left.flipLeft === right.flipLeft

export const areClearingPriceTooltipStatesEqual = (
  left: ToucanClearingPriceTooltipState,
  right: ToucanClearingPriceTooltipState,
): boolean =>
  left.left === right.left &&
  left.top === right.top &&
  left.isVisible === right.isVisible &&
  left.clearingPriceDecimal === right.clearingPriceDecimal &&
  left.volumeAtClearingPrice === right.volumeAtClearingPrice &&
  left.totalBidVolume === right.totalBidVolume

export const areChartBarTooltipStatesEqual = (
  left: ToucanChartBarTooltipState,
  right: ToucanChartBarTooltipState,
): boolean =>
  left.left === right.left &&
  left.top === right.top &&
  left.isVisible === right.isVisible &&
  left.tickValue === right.tickValue &&
  left.volumeAmount === right.volumeAmount &&
  left.totalVolume === right.totalVolume

export interface BidDistributionChartRendererProps {
  chartData: ProcessedChartData
  bidTokenInfo: BidTokenInfo
  totalSupply?: string
  auctionTokenDecimals?: number
  clearingPrice: string
  onchainClearingPrice?: string // For marker in-range detection (on-chain truth)
  floorPrice: string
  tickSize: string
  tokenColor?: string
  height?: number
  userBids: UserBid[]
  connectedWalletAddress?: string
  chartMode?: 'distribution' | 'demand'
}

export const areRendererPropsEqual = (
  left: BidDistributionChartRendererProps,
  right: BidDistributionChartRendererProps,
): boolean => {
  return (
    areProcessedChartDataEqual(left.chartData, right.chartData) &&
    areBidTokenInfoEqual(left.bidTokenInfo, right.bidTokenInfo) &&
    left.totalSupply === right.totalSupply &&
    left.auctionTokenDecimals === right.auctionTokenDecimals &&
    left.clearingPrice === right.clearingPrice &&
    left.onchainClearingPrice === right.onchainClearingPrice &&
    left.floorPrice === right.floorPrice &&
    left.tickSize === right.tickSize &&
    left.tokenColor === right.tokenColor &&
    left.height === right.height &&
    areUserBidsEqualUnordered(left.userBids, right.userBids) &&
    left.connectedWalletAddress === right.connectedWalletAddress &&
    left.chartMode === right.chartMode
  )
}
