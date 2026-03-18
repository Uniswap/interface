import type { IChartApi, UTCTimestamp } from 'lightweight-charts'
import { findNearestTickForPrice } from '~/components/Charts/ToucanChart/bidDistribution/controller/logic/nearestTick'
import type {
  ToucanBidDistributionChartControllerUpdateParams,
  ToucanBidLineTooltipState,
} from '~/components/Charts/ToucanChart/bidDistribution/types'
import { BID_LINE } from '~/components/Toucan/Auction/BidDistributionChart/constants'

export function computeBidLineTooltipState(params: {
  chart: IChartApi | null
  next: ToucanBidDistributionChartControllerUpdateParams
}): ToucanBidLineTooltipState {
  const { chart, next } = params

  if (!chart || !next.userBidPriceDecimal || !Number.isFinite(next.userBidPriceDecimal)) {
    return { left: 0, top: 0, isVisible: false, volumeAtTick: 0, volumePercent: 0, flipLeft: false }
  }

  const snappedTick = findNearestTickForPrice({ price: next.userBidPriceDecimal, ticks: next.barsForMarkers })
  if (snappedTick === null) {
    return { left: 0, top: 0, isVisible: false, volumeAtTick: 0, volumePercent: 0, flipLeft: false }
  }

  const scaledTime = Math.round(snappedTick * next.priceScaleFactor) as UTCTimestamp
  const bidPriceCoordinate = chart.timeScale().timeToCoordinate(scaledTime)
  if (bidPriceCoordinate === null) {
    return { left: 0, top: 0, isVisible: false, volumeAtTick: 0, volumePercent: 0, flipLeft: false }
  }

  const plotLeft = chart.priceScale('left').width()
  const plotWidth = chart.paneSize().width

  // Determine if we should flip the tooltip to the left side of the bid line
  // Flip when bid is past 60% of the chart width (same threshold as clearing price tooltip)
  const flipThreshold = plotWidth * 0.6
  const flipLeft = bidPriceCoordinate > flipThreshold

  // Calculate left position - offset direction depends on flip state
  // Note: The renderer adds another BID_LINE.TOOLTIP_OFFSET_X to this value.
  // When flipped, we use 3x offset so that after the renderer adds its offset and
  // translateX(-100%) is applied, the gap is consistent with the non-flipped case.
  const tooltipLeft =
    bidPriceCoordinate + plotLeft + (flipLeft ? -BID_LINE.TOOLTIP_OFFSET_X * 3 : BID_LINE.TOOLTIP_OFFSET_X)

  if (tooltipLeft < plotLeft || bidPriceCoordinate > plotWidth) {
    return { left: 0, top: 0, isVisible: false, volumeAtTick: 0, volumePercent: 0, flipLeft: false }
  }

  const matchingBar = next.barsForMarkers.find((bar) => Math.abs(bar.tick - snappedTick) < next.tickSizeDecimal * 0.1)
  const volumeAtTick = matchingBar?.amount ?? 0
  const volumePercent = next.totalBidVolume > 0 ? (volumeAtTick / next.totalBidVolume) * 100 : 0

  return {
    left: tooltipLeft,
    top: BID_LINE.TOOLTIP_TOP,
    isVisible: true,
    volumeAtTick,
    volumePercent,
    flipLeft,
  }
}
