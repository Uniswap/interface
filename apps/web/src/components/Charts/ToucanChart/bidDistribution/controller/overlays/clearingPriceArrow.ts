import type { IChartApi } from 'lightweight-charts'
import type { ToucanBidDistributionChartControllerCreateParams } from '~/components/Charts/ToucanChart/bidDistribution/types'
import { CLEARING_PRICE_LINE } from '~/components/Toucan/Auction/BidDistributionChart/constants'

export function createClearingPriceArrow(params: {
  colors: ToucanBidDistributionChartControllerCreateParams['colors']
}): HTMLDivElement {
  const { colors } = params
  const arrowContainer = document.createElement('div')
  Object.assign(arrowContainer.style, {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: '3',
    display: 'none',
    bottom: '8px',
    width: '0',
    height: '0',
    transform: 'translateX(-50%)',
    borderLeft: `${CLEARING_PRICE_LINE.ARROW_WIDTH / 2}px solid transparent`,
    borderRight: `${CLEARING_PRICE_LINE.ARROW_WIDTH / 2}px solid transparent`,
    borderBottom: `${CLEARING_PRICE_LINE.ARROW_HEIGHT}px solid ${colors.neutral1.val}`,
  })
  return arrowContainer
}

export function positionClearingPriceArrow(params: {
  clearingPriceArrow: HTMLDivElement
  chart: IChartApi
  clearingPriceCoordinate: number | null
}): void {
  const { clearingPriceArrow, chart, clearingPriceCoordinate } = params
  if (clearingPriceCoordinate === null) {
    clearingPriceArrow.style.display = 'none'
    return
  }

  const plotLeft = chart.priceScale('left').width()
  const plotWidth = Math.round(chart.paneSize().width)
  const arrowHalfWidth = CLEARING_PRICE_LINE.ARROW_WIDTH / 2
  const arrowLeft = clearingPriceCoordinate + plotLeft
  const minLeft = plotLeft + arrowHalfWidth
  const maxLeft = plotLeft + plotWidth - arrowHalfWidth

  if (plotWidth <= 0 || arrowLeft < minLeft || arrowLeft > maxLeft) {
    clearingPriceArrow.style.display = 'none'
    return
  }

  clearingPriceArrow.style.left = `${arrowLeft}px`
  clearingPriceArrow.style.display = 'block'
}
