import type { PlainMessage } from '@bufbuild/protobuf'
import { ClearingPriceChange } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { NumberType } from 'utilities/src/format/types'
import { ONE_HOUR_MS } from 'utilities/src/time/time'
import { fromQ96ToDecimalWithTokenDecimals } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { BidTokenInfo } from '~/features/Toucan/Auction/store/types'
import { computeFdvBidTokenRaw, formatCompactFromRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import { safeParseTimestampMs } from '~/features/Toucan/ToucanChart/clearingPrice/utils/timeConversions'

/**
 * Helper to format a tick value as bid token amount (e.g., "1.25 ETH")
 */
export function formatAsBidToken({
  tickValue,
  bidTokenInfo,
  formatNumber,
}: {
  tickValue: number
  bidTokenInfo: BidTokenInfo
  formatNumber: (value: number, type: NumberType) => string
}): string {
  const formatted = formatNumber(tickValue, NumberType.TokenNonTx)
  return `${formatted} ${bidTokenInfo.symbol}`
}

/**
 * Helper to format a valuation value (totalSupply * price) as bid token amount
 */
export function formatValuationAsBidToken({
  tickQ96,
  totalSupply,
  auctionTokenDecimals,
  bidTokenInfo,
}: {
  tickQ96: string
  totalSupply: string
  auctionTokenDecimals: number
  bidTokenInfo: BidTokenInfo
}): string {
  const valuationRaw = computeFdvBidTokenRaw({
    priceQ96: tickQ96,
    bidTokenDecimals: bidTokenInfo.decimals,
    totalSupplyRaw: totalSupply,
    auctionTokenDecimals,
  })

  const formatted = formatCompactFromRaw({
    raw: valuationRaw,
    decimals: bidTokenInfo.decimals,
    maxFractionDigits: 2,
  })

  return `${formatted} ${bidTokenInfo.symbol}`
}

export function computeHourlyChangePercent({
  clearingPriceDecimal,
  changes,
  bidTokenDecimals,
  auctionTokenDecimals,
}: {
  clearingPriceDecimal: number
  changes: PlainMessage<ClearingPriceChange>[] | undefined
  bidTokenDecimals: number | undefined
  auctionTokenDecimals: number | undefined
}): number | null {
  if (auctionTokenDecimals === undefined || !changes || changes.length === 0) {
    return null
  }
  const oneHourAgo = Date.now() - ONE_HOUR_MS
  let bestTime = 0
  let bestEntry: PlainMessage<ClearingPriceChange> | null = null
  for (const entry of changes) {
    const entryTime = safeParseTimestampMs(entry.createdAt) ?? 0
    if (entryTime > 0 && entryTime <= oneHourAgo && entryTime > bestTime) {
      bestTime = entryTime
      bestEntry = entry
    }
  }
  if (!bestEntry) {
    return null
  }
  const pastPrice = fromQ96ToDecimalWithTokenDecimals({
    q96Value: bestEntry.clearingPrice,
    bidTokenDecimals,
    auctionTokenDecimals,
  })
  if (pastPrice === 0) {
    return null
  }
  return ((clearingPriceDecimal - pastPrice) / pastPrice) * 100
}
