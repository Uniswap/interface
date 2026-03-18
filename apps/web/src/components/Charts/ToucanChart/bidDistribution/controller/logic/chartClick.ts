import type { IChartApi, ISeriesApi, MouseEventParams, Time } from 'lightweight-charts'
import type { ToucanChartData } from '~/components/Charts/ToucanChart/renderer'
import { priceToQ96WithDecimals, q96ToPriceString } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import type { BidTokenInfo } from '~/components/Toucan/Auction/store/types'
import { snapToNearestTick } from '~/components/Toucan/Auction/utils/ticks'

export function getSelectedTickPriceFromChartClick(params: {
  param: MouseEventParams<Time>
  chart: IChartApi
  series: ISeriesApi<'Custom'>
  priceScaleFactor: number
  bidTokenInfo: BidTokenInfo
  auctionTokenDecimals: number
  floorPriceQ96: string
  clearingPriceQ96: string
  tickSizeQ96: string
}): string | null {
  const {
    param,
    chart,
    series,
    priceScaleFactor,
    bidTokenInfo,
    auctionTokenDecimals,
    floorPriceQ96,
    clearingPriceQ96,
    tickSizeQ96,
  } = params

  // Prefer Q96 from bar data if present
  let tickQ96String: string | null = null
  let tickPrice: number | null = null

  if (param.time) {
    const data = param.seriesData.get(series as Parameters<typeof param.seriesData.get>[0]) as
      | ToucanChartData
      | undefined
    if (data?.tickQ96) {
      tickQ96String = data.tickQ96
    } else if (data) {
      tickPrice = data.tickValue ?? Number(data.time) / priceScaleFactor
    }
  }

  // Fallback: coordinate to time (enables clicking empty areas)
  if (!tickQ96String && tickPrice === null && param.point) {
    const coordinateTime = chart.timeScale().coordinateToTime(param.point.x)
    if (coordinateTime !== null) {
      tickPrice = Number(coordinateTime) / priceScaleFactor
    }
  }

  if (!tickQ96String && tickPrice === null) {
    return null
  }

  let snappedQ96: bigint
  if (tickQ96String) {
    snappedQ96 = snapToNearestTick({
      value: BigInt(tickQ96String),
      floorPrice: BigInt(floorPriceQ96),
      clearingPrice: BigInt(clearingPriceQ96),
      tickSize: BigInt(tickSizeQ96),
    })
  } else {
    const decimalShift = 10 ** bidTokenInfo.decimals
    // tickPrice is non-null in this branch because we guard above.
    const rawAmount = BigInt(Math.round(tickPrice! * decimalShift))
    // Use priceToQ96WithDecimals which properly accounts for auction token decimals
    const tickPriceQ96 = priceToQ96WithDecimals({ priceRaw: rawAmount, auctionTokenDecimals })
    snappedQ96 = snapToNearestTick({
      value: tickPriceQ96,
      floorPrice: BigInt(floorPriceQ96),
      clearingPrice: BigInt(clearingPriceQ96),
      tickSize: BigInt(tickSizeQ96),
    })
  }

  // Use q96ToPriceString which properly accounts for both bid and auction token decimals
  return q96ToPriceString({ q96Value: snappedQ96, bidTokenDecimals: bidTokenInfo.decimals, auctionTokenDecimals })
}
