import type { IChartApi, UTCTimestamp } from 'lightweight-charts'
import type { ToucanBidDistributionChartControllerCreateParams } from '~/components/Charts/ToucanChart/bidDistribution/types'
import { BID_LINE } from '~/components/Toucan/Auction/BidDistributionChart/constants'

export function createBidLineDot(params: {
  colors: ToucanBidDistributionChartControllerCreateParams['colors']
}): HTMLDivElement {
  const { colors } = params
  const dotContainer = document.createElement('div')
  const dotSize = BID_LINE.DOT_SIZE
  Object.assign(dotContainer.style, {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: '3',
    display: 'none',
    bottom: '8px',
    width: `${dotSize}px`,
    height: `${dotSize}px`,
    borderRadius: '50%',
    backgroundColor: colors.neutral1.val,
    transform: 'translateX(-50%)',
  })
  return dotContainer
}

export function updateBidLineDot({
  bidLineDot,
  chart,
  userBidTick,
  priceScaleFactor,
  bidLineXFromRenderer,
  hideDueToOverlap = false,
}: {
  bidLineDot: HTMLDivElement
  chart: IChartApi
  userBidTick: number | null
  priceScaleFactor: number
  /** Optional pre-calculated bid line X position from the renderer (in media/CSS coordinates) */
  bidLineXFromRenderer?: number | null
  /** Hide the dot when it overlaps with another element (e.g., clearing price arrow) */
  hideDueToOverlap?: boolean
}): void {
  if (!userBidTick || hideDueToOverlap) {
    bidLineDot.style.display = 'none'
    return
  }

  const plotLeft = chart.priceScale('left').width()
  const plotWidth = chart.paneSize().width

  // Prefer the renderer's calculated position (if available) to ensure the DOM dot
  // aligns exactly with the canvas-rendered line. Fall back to time-scale API calculation
  // when the renderer hasn't drawn yet (e.g., on very first update).
  let dotLeft: number
  if (bidLineXFromRenderer != null) {
    // Renderer position is already in media coordinates and includes the X_OFFSET
    dotLeft = bidLineXFromRenderer + plotLeft
  } else {
    // Fallback: calculate from time-scale API
    const scaledTime = Math.round(userBidTick * priceScaleFactor) as UTCTimestamp
    const bidPriceCoordinate = chart.timeScale().timeToCoordinate(scaledTime)
    if (bidPriceCoordinate === null) {
      bidLineDot.style.display = 'none'
      return
    }
    dotLeft = bidPriceCoordinate + plotLeft + BID_LINE.X_OFFSET
  }

  const isWithinLeftBound = dotLeft >= plotLeft
  const isWithinRightBound = dotLeft - plotLeft <= plotWidth

  if (isWithinLeftBound && isWithinRightBound) {
    bidLineDot.style.left = `${dotLeft}px`
    bidLineDot.style.display = 'block'
  } else {
    bidLineDot.style.display = 'none'
  }
}
