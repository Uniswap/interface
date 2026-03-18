import type { ClearingPriceChange } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { ONE_DAY_MS, ONE_SECOND_MS } from 'utilities/src/time/time'
import type {
  ClearingPriceChartPoint,
  NormalizedClearingPriceSeries,
} from '~/components/Charts/ToucanChart/clearingPrice/types'
import { averageBlockTimeMs } from '~/components/Charts/ToucanChart/clearingPrice/utils/blockTime'
import {
  safeParseInt,
  safeParseTimestampMs,
  toUtcTimestampSeconds,
} from '~/components/Charts/ToucanChart/clearingPrice/utils/timeConversions'
import {
  calculateNiceYRange,
  calculateScaleFactor,
} from '~/components/Charts/ToucanChart/clearingPrice/utils/yAxisRange'
import { fromQ96ToDecimalWithTokenDecimals } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import type { AuctionDetails } from '~/components/Toucan/Auction/store/types'

/**
 * Target number of data points to generate across the full time range.
 * This ensures the chart distributes horizontal space evenly by time,
 * regardless of how the source data is distributed.
 */
const TARGET_CHART_POINTS = 200

interface TimeUniformDataParams {
  priceChanges: ClearingPriceChartPoint[]
  startTimeSeconds: number
  endTimeSeconds: number
}

/**
 * Generate time-uniform chart data from step-function price changes.
 *
 * The clearing price data represents discrete price changes at specific blocks/times.
 * If we use these directly, the chart would compress time periods with few changes
 * and expand periods with many changes.
 *
 * Instead, we sample the price at regular time intervals to ensure the x-axis
 * represents time uniformly. For a step line chart, we find the most recent
 * price at each sample time.
 */
function generateTimeUniformData(params: TimeUniformDataParams): ClearingPriceChartPoint[] {
  const { priceChanges, startTimeSeconds, endTimeSeconds } = params
  if (priceChanges.length === 0) {
    return []
  }

  const totalDurationSeconds = endTimeSeconds - startTimeSeconds
  if (totalDurationSeconds <= 0) {
    return priceChanges
  }

  // Calculate interval between sample points
  const intervalSeconds = Math.max(totalDurationSeconds / TARGET_CHART_POINTS, 60) // At least 1 minute between points

  const result: ClearingPriceChartPoint[] = []
  const sortedChanges = [...priceChanges].sort((a, b) => a.time - b.time)

  // Generate data points at regular intervals
  let currentTime = startTimeSeconds
  let changeIndex = 0

  while (currentTime <= endTimeSeconds) {
    // Find the most recent price change at or before currentTime
    while (changeIndex < sortedChanges.length - 1 && sortedChanges[changeIndex + 1]!.time <= currentTime) {
      changeIndex++
    }

    const currentPrice = sortedChanges[changeIndex]!

    result.push({
      time: currentTime as ClearingPriceChartPoint['time'],
      value: currentPrice.value,
      q96: currentPrice.q96,
    })

    currentTime += intervalSeconds
  }

  // Ensure we include the exact end time if not already included
  const lastPoint = result[result.length - 1]!
  if (lastPoint.time < endTimeSeconds) {
    const finalPrice = sortedChanges[sortedChanges.length - 1]!
    result.push({
      time: endTimeSeconds as ClearingPriceChartPoint['time'],
      value: finalPrice.value,
      q96: finalPrice.q96,
    })
  }

  return result
}

interface NormalizeSeriesParams {
  auctionDetails: AuctionDetails
  bidTokenDecimals?: number
  auctionTokenDecimals?: number
  currentBlockNumber?: number
  clearingHistory: ClearingPriceChange[] | undefined
  latestClearingPriceQ96?: string
  auctionStartBlockTimestamp?: bigint
  auctionEndBlockTimestamp?: bigint
}

/**
 * Transform raw clearing price data into normalized chart series data.
 *
 * Responsibilities:
 * - Convert Q96 prices to decimal values
 * - Calculate timestamps from block numbers
 * - Sort and deduplicate data points
 * - Calculate Y-axis range with nice boundaries
 * - Apply scaling for small values
 * - Ensure chart spans full auction duration with appropriate end buffer
 */
export function normalizeClearingSeries({
  auctionDetails,
  bidTokenDecimals,
  auctionTokenDecimals,
  currentBlockNumber,
  clearingHistory,
  latestClearingPriceQ96,
  auctionStartBlockTimestamp,
  auctionEndBlockTimestamp,
}: NormalizeSeriesParams): NormalizedClearingPriceSeries | null {
  const auctionStartBlock = safeParseInt(auctionDetails.startBlock) ?? 0
  const auctionEndBlock = safeParseInt(auctionDetails.endBlock) ?? auctionStartBlock + 1
  const avgMs = averageBlockTimeMs(auctionDetails.chainId)
  const currentBlock = currentBlockNumber

  const auctionStartTimeMs =
    auctionStartBlockTimestamp !== undefined
      ? Number(auctionStartBlockTimestamp) * ONE_SECOND_MS
      : safeParseTimestampMs(auctionDetails.createdAt)

  if (auctionStartTimeMs === undefined) {
    return null
  }

  const auctionEndTimeMs =
    auctionEndBlockTimestamp !== undefined
      ? Number(auctionEndBlockTimestamp) * ONE_SECOND_MS
      : auctionStartTimeMs + (auctionEndBlock - auctionStartBlock) * avgMs

  if (currentBlock === undefined) {
    return null
  }

  const currentTimeMs =
    auctionStartTimeMs + Math.max(0, Math.min(currentBlock, auctionEndBlock) - auctionStartBlock) * avgMs

  const auctionEnded = currentBlock >= auctionEndBlock
  const startPointQ96 = auctionDetails.floorPrice || '0'
  const startValue = fromQ96ToDecimalWithTokenDecimals({
    q96Value: startPointQ96,
    bidTokenDecimals,
    auctionTokenDecimals,
  })

  // ClearingPriceChange.startBlock is the block where price changed (not auction start)
  const historySorted = (clearingHistory ?? [])
    .filter((p) => Number(p.startBlock) >= auctionStartBlock)
    .slice()
    .sort((a, b) => Number(a.startBlock) - Number(b.startBlock))

  // Start with the initial point at auction start
  const points: ClearingPriceChartPoint[] = [
    {
      time: toUtcTimestampSeconds(auctionStartTimeMs),
      value: startValue,
      q96: startPointQ96,
    },
  ]

  for (const entry of historySorted) {
    const entryMs =
      safeParseTimestampMs(entry.createdAt) ??
      auctionStartTimeMs + (Number(entry.startBlock) - auctionStartBlock) * avgMs
    const q96 = entry.clearingPrice
    const value = fromQ96ToDecimalWithTokenDecimals({ q96Value: q96, bidTokenDecimals, auctionTokenDecimals })
    points.push({
      time: toUtcTimestampSeconds(entryMs),
      value,
      q96,
    })
  }

  const lastHistoryQ96 =
    historySorted.length > 0 ? historySorted[historySorted.length - 1]!.clearingPrice : startPointQ96
  const normalizedLatestClearingPriceQ96 =
    latestClearingPriceQ96 && latestClearingPriceQ96 !== '0' ? latestClearingPriceQ96 : undefined

  let latestPointTimeMs: number | undefined
  if (normalizedLatestClearingPriceQ96 && normalizedLatestClearingPriceQ96 !== lastHistoryQ96) {
    const latestValue = fromQ96ToDecimalWithTokenDecimals({
      q96Value: normalizedLatestClearingPriceQ96,
      bidTokenDecimals,
      auctionTokenDecimals,
    })
    const lastPointTimeSeconds = points[points.length - 1]!.time
    let latestTimeSeconds = toUtcTimestampSeconds(currentTimeMs)
    if (latestTimeSeconds <= lastPointTimeSeconds) {
      latestTimeSeconds = (lastPointTimeSeconds + 1) as ClearingPriceChartPoint['time']
    }
    latestPointTimeMs = latestTimeSeconds * ONE_SECOND_MS
    points.push({
      time: latestTimeSeconds as ClearingPriceChartPoint['time'],
      value: latestValue,
      q96: normalizedLatestClearingPriceQ96,
    })
  }

  // Get the last known clearing price for extending the line
  const lastPoint = points[points.length - 1]!

  // Determine chart end time:
  // - If auction ended: show full auction duration (data line extends to end)
  // - If auction ongoing: data line extends to current time only
  const chartDataEndTimeMs = auctionEnded
    ? Math.max(auctionEndTimeMs, latestPointTimeMs ?? auctionEndTimeMs)
    : Math.max(currentTimeMs, latestPointTimeMs ?? currentTimeMs)

  // Extend line to the data end time with last known clearing price
  if (toUtcTimestampSeconds(chartDataEndTimeMs) > lastPoint.time) {
    points.push({
      time: toUtcTimestampSeconds(chartDataEndTimeMs),
      value: lastPoint.value,
      q96: lastPoint.q96,
    })
  }

  // Ensure strictly increasing time (lightweight-charts requirement).
  const deduped: ClearingPriceChartPoint[] = []
  for (const p of points) {
    if (deduped.length === 0 || p.time > deduped[deduped.length - 1]!.time) {
      deduped.push(p)
    }
  }

  // Generate time-uniform data points for even x-axis distribution.
  // This ensures the chart distributes horizontal space evenly by time,
  // regardless of how densely packed the original price change events are.
  const chartStartTimeSeconds = toUtcTimestampSeconds(auctionStartTimeMs)
  const chartEndTimeSeconds = toUtcTimestampSeconds(chartDataEndTimeMs)
  const timeUniformData = generateTimeUniformData({
    priceChanges: deduped,
    startTimeSeconds: chartStartTimeSeconds,
    endTimeSeconds: chartEndTimeSeconds,
  })

  // Calculate nice Y-axis range from actual data values
  const values = deduped.map((p) => p.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)

  // Calculate scale factor for small values
  const scaleFactor = calculateScaleFactor(maxValue)
  const { yMin, yMax, scaledYMin, scaledYMax } = calculateNiceYRange({ minValue, maxValue, scaleFactor })

  // Scale the data points for lightweight-charts (use time-uniform data for rendering)
  const scaledData = timeUniformData.map((p) => ({
    ...p,
    value: p.value * scaleFactor,
  }))

  // Calculate visible range for the chart
  const visibleRangeStart = toUtcTimestampSeconds(auctionStartTimeMs)

  // For in-progress auctions, extend visible range to position data at ~75% from left
  // This creates blank space on the right to indicate the auction is ongoing
  // Formula: if elapsed time takes 75% of visible range, then visibleRange = elapsed / 0.75
  const isAuctionInProgress = !auctionEnded
  let visibleRangeEndMs: number
  if (isAuctionInProgress) {
    const elapsedMs = currentTimeMs - auctionStartTimeMs
    // Extend the visible range so current time is at 75% position
    // totalVisibleMs = elapsedMs / 0.75 = elapsedMs * 1.333...
    const totalVisibleMs = elapsedMs / 0.75
    visibleRangeEndMs = auctionStartTimeMs + totalVisibleMs
    // Cap at auction end time + small buffer to not extend too far past auction end
    const maxEndMs = auctionEndTimeMs + (auctionEndTimeMs - auctionStartTimeMs) * 0.1
    visibleRangeEndMs = Math.min(visibleRangeEndMs, maxEndMs)
  } else {
    visibleRangeEndMs = chartDataEndTimeMs
  }
  const visibleRangeEnd = toUtcTimestampSeconds(visibleRangeEndMs)

  // Calculate time span in days for determining x-axis format (use visible range, not data range)
  const timeSpanDays = (visibleRangeEndMs - auctionStartTimeMs) / ONE_DAY_MS

  return {
    data: scaledData,
    originalData: deduped,
    startTime: deduped[0]?.time,
    endTime: deduped[deduped.length - 1]?.time,
    yMin,
    yMax,
    scaledYMin,
    scaledYMax,
    scaleFactor,
    timeSpanDays,
    visibleRangeStart,
    visibleRangeEnd,
    isAuctionInProgress,
    auctionEndTime: toUtcTimestampSeconds(auctionEndTimeMs),
  }
}
