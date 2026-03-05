import type { IChartApi, UTCTimestamp } from 'lightweight-charts'
import type { ToucanBidDistributionChartControllerCreateParams } from '~/components/Charts/ToucanChart/bidDistribution/types'
import {
  BID_OUT_OF_RANGE_INDICATOR,
  CHART_FONT_FAMILY,
} from '~/components/Toucan/Auction/BidDistributionChart/constants'
import { formatTickForDisplay } from '~/components/Toucan/Auction/BidDistributionChart/utils/utils'
import type { BidTokenInfo } from '~/components/Toucan/Auction/store/types'

export function createBidOutOfRangeIndicator(params: {
  colors: ToucanBidDistributionChartControllerCreateParams['colors']
  labelText: string
}): HTMLDivElement {
  const { colors, labelText } = params
  const container = document.createElement('div')
  Object.assign(container.style, {
    position: 'absolute',
    pointerEvents: 'auto',
    cursor: 'pointer',
    zIndex: '4',
    display: 'none',
    top: '50%',
    transform: 'translateY(-50%)',
    padding: `${BID_OUT_OF_RANGE_INDICATOR.PADDING}px`,
    backgroundColor: colors.surface2.val,
    border: `1px solid ${colors.surface3.val}`,
    borderRadius: '8px',
    flexDirection: 'row',
    alignItems: 'center',
    gap: `${BID_OUT_OF_RANGE_INDICATOR.LABEL_OFFSET}px`,
    fontFamily: CHART_FONT_FAMILY,
    fontSize: '11px',
    color: colors.neutral2.val,
    whiteSpace: 'nowrap',
  })

  const arrow = document.createElement('div')
  arrow.setAttribute('data-role', 'arrow')
  Object.assign(arrow.style, {
    width: '0',
    height: '0',
    borderTop: `${BID_OUT_OF_RANGE_INDICATOR.ARROW_SIZE / 2}px solid transparent`,
    borderBottom: `${BID_OUT_OF_RANGE_INDICATOR.ARROW_SIZE / 2}px solid transparent`,
    borderLeft: `${BID_OUT_OF_RANGE_INDICATOR.ARROW_SIZE}px solid ${colors.neutral2.val}`,
    flexShrink: '0',
  })

  const contentWrapper = document.createElement('div')
  contentWrapper.setAttribute('data-role', 'content')
  Object.assign(contentWrapper.style, {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  })

  const label = document.createElement('span')
  label.setAttribute('data-role', 'label')
  label.textContent = labelText
  Object.assign(label.style, {
    fontWeight: '500',
    color: colors.neutral1.val,
  })

  const value = document.createElement('span')
  value.setAttribute('data-role', 'value')
  Object.assign(value.style, {
    fontSize: `${BID_OUT_OF_RANGE_INDICATOR.VALUE_FONT_SIZE}px`,
    color: colors.neutral2.val,
  })

  contentWrapper.appendChild(label)
  contentWrapper.appendChild(value)
  container.appendChild(contentWrapper)
  container.appendChild(arrow)

  return container
}

export function updateBidOutOfRangeIndicator({
  bidOutOfRangeIndicator,
  chart,
  userBidPriceDecimal,
  priceScaleFactor,
  formatFdvValue,
  fdvLabel,
  bidTokenInfo,
  totalSupply,
  auctionTokenDecimals,
  colors,
  canExtendToBid,
}: {
  bidOutOfRangeIndicator: HTMLDivElement
  chart: IChartApi
  userBidPriceDecimal: number | null
  priceScaleFactor: number
  formatFdvValue: (amount: number) => string
  fdvLabel: string
  bidTokenInfo: BidTokenInfo
  totalSupply?: string
  auctionTokenDecimals: number
  colors: ToucanBidDistributionChartControllerCreateParams['colors']
  /** Whether clicking the indicator can extend the chart to show the bid */
  canExtendToBid: boolean
}): void {
  if (!userBidPriceDecimal) {
    bidOutOfRangeIndicator.style.display = 'none'
    return
  }

  const timeScale = chart.timeScale()
  let visibleRange
  try {
    visibleRange = timeScale.getVisibleRange()
  } catch {
    bidOutOfRangeIndicator.style.display = 'none'
    return
  }
  if (!visibleRange) {
    bidOutOfRangeIndicator.style.display = 'none'
    return
  }

  const scaledTime = Math.round(userBidPriceDecimal * priceScaleFactor) as UTCTimestamp
  const plotLeft = chart.priceScale('left').width()
  const plotWidth = chart.paneSize().width

  const bidPriceCoordinate = timeScale.timeToCoordinate(scaledTime)
  const isAboveRange = scaledTime > (visibleRange.to as number)
  const isBelowRange = scaledTime < (visibleRange.from as number)
  const isOutsideCanvasLeft = bidPriceCoordinate !== null && bidPriceCoordinate < 0
  const isOutsideCanvasRight = bidPriceCoordinate !== null && bidPriceCoordinate > plotWidth

  const showOnRight = isAboveRange || isOutsideCanvasRight
  const showOnLeft = isBelowRange || isOutsideCanvasLeft

  if (!showOnRight && !showOnLeft) {
    bidOutOfRangeIndicator.style.display = 'none'
    return
  }

  const valueElement = bidOutOfRangeIndicator.querySelector('[data-role="value"]') as HTMLSpanElement | null
  if (valueElement) {
    const formattedValue = formatTickForDisplay({
      tickValue: userBidPriceDecimal,
      bidTokenInfo,
      totalSupply,
      auctionTokenDecimals,
      formatter: formatFdvValue,
    })
    valueElement.textContent = `${formattedValue} ${fdvLabel}`
  }

  const arrow = bidOutOfRangeIndicator.querySelector('[data-role="arrow"]') as HTMLDivElement | null
  const content = bidOutOfRangeIndicator.querySelector('[data-role="content"]') as HTMLDivElement | null

  if (showOnRight) {
    bidOutOfRangeIndicator.style.right = `${BID_OUT_OF_RANGE_INDICATOR.PADDING}px`
    bidOutOfRangeIndicator.style.left = 'auto'
    if (arrow && content) {
      if (bidOutOfRangeIndicator.firstChild !== content) {
        bidOutOfRangeIndicator.innerHTML = ''
        bidOutOfRangeIndicator.appendChild(content)
        bidOutOfRangeIndicator.appendChild(arrow)
      }
      Object.assign(arrow.style, {
        borderLeft: `${BID_OUT_OF_RANGE_INDICATOR.ARROW_SIZE}px solid ${colors.neutral2.val}`,
        borderRight: 'none',
      })
    }
  } else {
    bidOutOfRangeIndicator.style.left = `${plotLeft + BID_OUT_OF_RANGE_INDICATOR.PADDING}px`
    bidOutOfRangeIndicator.style.right = 'auto'
    if (arrow && content) {
      if (bidOutOfRangeIndicator.firstChild !== arrow) {
        bidOutOfRangeIndicator.innerHTML = ''
        bidOutOfRangeIndicator.appendChild(arrow)
        bidOutOfRangeIndicator.appendChild(content)
      }
      Object.assign(arrow.style, {
        borderRight: `${BID_OUT_OF_RANGE_INDICATOR.ARROW_SIZE}px solid ${colors.neutral2.val}`,
        borderLeft: 'none',
      })
    }
  }

  bidOutOfRangeIndicator.style.display = 'flex'
  bidOutOfRangeIndicator.style.cursor = canExtendToBid ? 'pointer' : 'default'
}
