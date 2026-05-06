import { fromQ96ToDecimalWithTokenDecimals } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { toDecimal, type ChartBarData } from '~/features/Toucan/Auction/BidDistributionChart/utils/utils'
import type { BidTokenInfo } from '~/features/Toucan/Auction/store/types'

export const BAR_PIXEL_PITCH = 4 // BAR_STYLE: 3px height + 1px gap
const MIN_BAR_COUNT = 20

export interface ParsedBidEntry {
  tickDecimal: number
  amount: number
  tickQ96: string
}

/**
 * Parse raw bid Map entries once into decimals. Call this in a memo keyed on
 * bidData so per-frame pan/zoom re-bucketing doesn't repeat BigInt conversions.
 */
export function parseBidEntries(params: {
  bidData: Map<string, string> | null | undefined
  bidTokenInfo: BidTokenInfo
  auctionTokenDecimals: number
}): ParsedBidEntry[] {
  const { bidData, bidTokenInfo, auctionTokenDecimals } = params
  if (!bidData) {
    return []
  }
  const entries: ParsedBidEntry[] = []
  for (const [tickQ96, amountRaw] of bidData) {
    const tickDecimal = fromQ96ToDecimalWithTokenDecimals({
      q96Value: tickQ96,
      bidTokenDecimals: bidTokenInfo.decimals,
      auctionTokenDecimals,
    })
    if (!Number.isFinite(tickDecimal)) {
      continue
    }
    const amount = toDecimal(amountRaw, bidTokenInfo.decimals)
    const adjustedAmount = bidTokenInfo.priceFiat > 0 ? amount * bidTokenInfo.priceFiat : amount
    entries.push({ tickDecimal, amount: adjustedAmount, tickQ96 })
  }
  return entries
}

interface BucketAggregate {
  amount: number
  dominantAmount: number
  dominantTickQ96: string
}

/**
 * Re-buckets parsed bid entries against the currently-visible unscaled price
 * range so the distribution overlay gets view-adaptive resolution. Each bucket's
 * `tick` is the bucket center (so bars space evenly and never visually overlap),
 * while `tickQ96` is the Q96 of the highest-volume entry in the bucket (so clicks
 * snap to the dominant actual bid rather than a synthetic center).
 */
export function buildViewAdaptiveBars(params: {
  entries: ParsedBidEntry[]
  visiblePriceRangeUnscaled: { min: number; max: number } | null | undefined
  chartHeightPx: number
}): ChartBarData[] {
  const { entries, visiblePriceRangeUnscaled, chartHeightPx } = params
  if (entries.length === 0 || !visiblePriceRangeUnscaled) {
    return []
  }
  const { min, max } = visiblePriceRangeUnscaled
  const range = max - min
  if (!(range > 0) || !Number.isFinite(range)) {
    return []
  }

  const bucketCount = Math.max(MIN_BAR_COUNT, Math.floor(chartHeightPx / BAR_PIXEL_PITCH))
  const barStep = range / bucketCount

  const buckets = new Map<number, BucketAggregate>()
  for (const entry of entries) {
    const { tickDecimal, amount, tickQ96 } = entry
    if (tickDecimal < min || tickDecimal > max) {
      continue
    }
    const bucketIdx = Math.min(bucketCount - 1, Math.floor((tickDecimal - min) / barStep))
    const existing = buckets.get(bucketIdx)
    if (existing) {
      existing.amount += amount
      if (amount > existing.dominantAmount) {
        existing.dominantAmount = amount
        existing.dominantTickQ96 = tickQ96
      }
    } else {
      buckets.set(bucketIdx, { amount, dominantAmount: amount, dominantTickQ96: tickQ96 })
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(
      ([idx, v], i): ChartBarData => ({
        tick: min + (idx + 0.5) * barStep,
        tickQ96: v.dominantTickQ96,
        tickDisplay: '',
        amount: v.amount,
        index: i,
      }),
    )
}
