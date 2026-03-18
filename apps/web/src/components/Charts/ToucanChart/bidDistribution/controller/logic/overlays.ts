import type { IChartApi } from 'lightweight-charts'
import { findClearingPriceCoordinate } from '~/components/Charts/ToucanChart/bidDistribution/controller/logic/clearingPriceCoordinate'
import { findNearestTickForPrice } from '~/components/Charts/ToucanChart/bidDistribution/controller/logic/nearestTick'
import { updateBidLineDot } from '~/components/Charts/ToucanChart/bidDistribution/controller/overlays/bidLineDot'
import { updateBidOutOfRangeIndicator } from '~/components/Charts/ToucanChart/bidDistribution/controller/overlays/bidOutOfRangeIndicator'
import { positionClearingPriceArrow } from '~/components/Charts/ToucanChart/bidDistribution/controller/overlays/clearingPriceArrow'
import { updateLabelsLayer } from '~/components/Charts/ToucanChart/bidDistribution/controller/overlays/labelsLayer'
import type {
  ToucanBidDistributionChartControllerCreateParams,
  ToucanBidDistributionChartControllerUpdateParams,
} from '~/components/Charts/ToucanChart/bidDistribution/types'
import {
  BID_LINE,
  CLEARING_PRICE_LINE,
  MAX_RENDERABLE_BARS,
} from '~/components/Toucan/Auction/BidDistributionChart/constants'

export const EXTENSION_PADDING_TICKS = 50

/**
 * Checks if extending the chart to show a bid would exceed MAX_RENDERABLE_BARS.
 * Returns true if extension is safe, false if it would cause too many bars.
 */
export function canExtendChartToBid({
  userBidPriceDecimal,
  minTick,
  tickSizeDecimal,
}: {
  userBidPriceDecimal: number | null
  minTick: number
  tickSizeDecimal: number
}): boolean {
  if (!userBidPriceDecimal || tickSizeDecimal <= 0) {
    return false
  }
  // Calculate how many bars would be needed if we extend to (bid + 50 ticks)
  const extendedMaxTick = userBidPriceDecimal + EXTENSION_PADDING_TICKS * tickSizeDecimal
  const totalBarsNeeded = Math.ceil((extendedMaxTick - minTick) / tickSizeDecimal) + 1
  return totalBarsNeeded <= MAX_RENDERABLE_BARS
}

export function updateBidDistributionOverlays({
  chart,
  createParams,
  next,
  elements,
  clearingPriceXFromRenderer,
  bidLineXFromRenderer,
}: {
  chart: IChartApi
  createParams: Pick<
    ToucanBidDistributionChartControllerCreateParams,
    'renderLabels' | 'formatFdvValue' | 'fdvLabel' | 'colors'
  >
  next: ToucanBidDistributionChartControllerUpdateParams
  elements: {
    labelsLayer: HTMLDivElement | null
    clearingPriceArrow: HTMLDivElement | null
    bidLineDot: HTMLDivElement | null
    bidOutOfRangeIndicator: HTMLDivElement | null
  }
  /** Optional pre-calculated clearing price X position from the renderer (in media/CSS coordinates) */
  clearingPriceXFromRenderer?: number | null
  /** Optional pre-calculated bid line X position from the renderer (in media/CSS coordinates) */
  bidLineXFromRenderer?: number | null
}): void {
  if (elements.labelsLayer) {
    updateLabelsLayer({
      labelsLayer: elements.labelsLayer,
      chart,
      priceScaleFactor: next.priceScaleFactor,
      renderLabels: createParams.renderLabels,
    })
  }

  // Clearing price arrow (at bottom of clearing price line)
  // Prefer the renderer's calculated position (if available) to ensure the DOM triangle
  // aligns exactly with the canvas-rendered line. Fall back to time-scale API calculation
  // when the renderer hasn't drawn yet (e.g., on very first update).
  const clearingPriceCoordinate =
    clearingPriceXFromRenderer ??
    findClearingPriceCoordinate({
      chart,
      clearingPrice: next.clearingPriceDecimal,
      bars: next.barsForMarkers,
      priceScaleFactor: next.priceScaleFactor,
    })

  if (elements.clearingPriceArrow) {
    positionClearingPriceArrow({
      clearingPriceArrow: elements.clearingPriceArrow,
      chart,
      clearingPriceCoordinate,
    })
  }

  // Bid dot (at bottom of bid line) – shown when bid tick is visible
  // Hide if it overlaps with the clearing price arrow (both positioned at bottom: 8px)
  if (elements.bidLineDot) {
    const userBidTick = next.userBidPriceDecimal
      ? findNearestTickForPrice({ price: next.userBidPriceDecimal, ticks: next.barsForMarkers })
      : null

    // Check if bid dot and clearing price arrow would overlap
    let hideBidDotDueToOverlap = false
    if (clearingPriceCoordinate != null && bidLineXFromRenderer != null) {
      const distance = Math.abs(clearingPriceCoordinate - bidLineXFromRenderer)
      const overlapThreshold = (CLEARING_PRICE_LINE.ARROW_WIDTH + BID_LINE.DOT_SIZE) / 2
      hideBidDotDueToOverlap = distance < overlapThreshold
    }

    updateBidLineDot({
      bidLineDot: elements.bidLineDot,
      chart,
      userBidTick,
      priceScaleFactor: next.priceScaleFactor,
      bidLineXFromRenderer,
      hideDueToOverlap: hideBidDotDueToOverlap,
    })
  }

  // Out-of-range indicator (clickable only if extension won't exceed MAX_RENDERABLE_BARS)
  if (elements.bidOutOfRangeIndicator) {
    const canExtend = canExtendChartToBid({
      userBidPriceDecimal: next.userBidPriceDecimal,
      minTick: next.minTick,
      tickSizeDecimal: next.tickSizeDecimal,
    })
    updateBidOutOfRangeIndicator({
      bidOutOfRangeIndicator: elements.bidOutOfRangeIndicator,
      chart,
      userBidPriceDecimal: next.userBidPriceDecimal,
      priceScaleFactor: next.priceScaleFactor,
      formatFdvValue: createParams.formatFdvValue,
      fdvLabel: createParams.fdvLabel,
      bidTokenInfo: next.bidTokenInfo,
      totalSupply: next.totalSupply,
      auctionTokenDecimals: next.auctionTokenDecimals,
      colors: createParams.colors,
      canExtendToBid: canExtend,
    })
  }
}
