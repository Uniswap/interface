import { TimestampedAmount } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { useContext, useMemo } from 'react'
import { ExploreContext } from 'state/explore'
import { logger } from 'utilities/src/logger/logger'

/**
 * Extracts the latest and previous values for a protocol from timestamped data.
 * Uses the most recent data point available for each protocol, regardless of other protocols' timestamps.
 * This prevents showing 0 values when protocols have data at different timestamps due to sync delays.
 */
function getLatestAndPreviousValues(
  data: TimestampedAmount[] | undefined,
  options?: { protocolName?: string; isLoading?: boolean },
): {
  latest: { value: number; timestamp: number }
  previous: { value: number; timestamp: number }
} {
  if (!data || data.length === 0) {
    // Only log warning if data is missing AND not currently loading
    if (options?.protocolName && !options.isLoading) {
      logger.warn(
        'protocolStats',
        'getLatestAndPreviousValues',
        `No data available for protocol ${options.protocolName}`,
      )
    }
    return {
      latest: { value: 0, timestamp: 0 },
      previous: { value: 0, timestamp: 0 },
    }
  }

  const sorted = [...data].sort((a, b) => Number(b.timestamp) - Number(a.timestamp))

  return {
    latest: { value: Number(sorted[0].value), timestamp: Number(sorted[0].timestamp) },
    previous:
      sorted.length > 1
        ? { value: Number(sorted[1].value), timestamp: Number(sorted[1].timestamp) }
        : { value: 0, timestamp: 0 },
  }
}

/**
 * Returns:
 * - total 24h volume (sum of all protocols for the latest day)
 * - each protocol’s 24h volume (v2, v3, and v4)
 * - 24hr total volume percentage change
 *
 * Each protocol uses its own latest available data point, preventing 0 values when timestamps differ.
 */
export function use24hProtocolVolume() {
  const {
    protocolStats: { data, isLoading },
  } = useContext(ExploreContext)

  const v2Data: TimestampedAmount[] | undefined = data?.historicalProtocolVolume?.Month?.v2
  const v3Data: TimestampedAmount[] | undefined = data?.historicalProtocolVolume?.Month?.v3
  const v4Data: TimestampedAmount[] | undefined = data?.historicalProtocolVolume?.Month?.v4

  return useMemo(() => {
    const v2 = getLatestAndPreviousValues(v2Data, { protocolName: 'V2', isLoading })
    const v3 = getLatestAndPreviousValues(v3Data, { protocolName: 'V3', isLoading })
    const v4 = getLatestAndPreviousValues(v4Data, { protocolName: 'V4', isLoading })

    const totalLatest = v2.latest.value + v3.latest.value + v4.latest.value
    const totalPrevious = v2.previous.value + v3.previous.value + v4.previous.value

    const computeChangePercent = (latest: number, previous: number): number => {
      // If previous is 0, treat change as 0% rather than showing misleading "infinite growth".
      // This handles cases like new protocol launches where there's no meaningful baseline for comparison.
      if (previous === 0) {
        return 0
      }
      return ((latest - previous) / previous) * 100
    }

    const totalChangePercent = computeChangePercent(totalLatest, totalPrevious)

    return {
      isLoading,
      totalVolume: totalLatest,
      totalChangePercent,
      protocolVolumes: {
        v2: v2.latest.value,
        v3: v3.latest.value,
        v4: v4.latest.value,
      },
    }
  }, [isLoading, v2Data, v3Data, v4Data])
}

/**
 * Returns:
 * - total 24h TVL (sum of all protocols for the latest day)
 * - each protocol’s 24h TVL (v2, v3, and v4)
 * - 24hr total TVL percentage change
 * - each protocol’s 24hr TVL percentage change (v2, v3, and v4)
 *
 * Each protocol uses its own latest available data point, preventing 0 values when timestamps differ.
 */
export function useDailyTVLWithChange() {
  const {
    protocolStats: { data, isLoading },
  } = useContext(ExploreContext)

  const v2Data: TimestampedAmount[] | undefined = data?.dailyProtocolTvl?.v2
  const v3Data: TimestampedAmount[] | undefined = data?.dailyProtocolTvl?.v3
  const v4Data: TimestampedAmount[] | undefined = data?.dailyProtocolTvl?.v4

  return useMemo(() => {
    const v2 = getLatestAndPreviousValues(v2Data, { protocolName: 'V2', isLoading })
    const v3 = getLatestAndPreviousValues(v3Data, { protocolName: 'V3', isLoading })
    const v4 = getLatestAndPreviousValues(v4Data, { protocolName: 'V4', isLoading })

    const protocolTVL = {
      v2: v2.latest.value,
      v3: v3.latest.value,
      v4: v4.latest.value,
    }

    const totalTVL = v2.latest.value + v3.latest.value + v4.latest.value
    const previousTotal = v2.previous.value + v3.previous.value + v4.previous.value

    // If previous is 0, treat change as 0% rather than showing misleading "infinite growth".
    // This handles cases like new protocol launches where there's no meaningful baseline for comparison.
    const computeChangePercent = (latestVal: number, previousVal: number) =>
      previousVal === 0 ? 0 : ((latestVal - previousVal) / previousVal) * 100

    // Combined protocol changes
    const totalChangePercent = computeChangePercent(totalTVL, previousTotal)

    // Individual protocol changes
    const v2Change = computeChangePercent(v2.latest.value, v2.previous.value)
    const v3Change = computeChangePercent(v3.latest.value, v3.previous.value)
    const v4Change = computeChangePercent(v4.latest.value, v4.previous.value)

    return {
      isLoading,
      totalTVL,
      protocolTVL,
      totalChangePercent,
      protocolChangePercent: {
        v2: v2Change,
        v3: v3Change,
        v4: v4Change,
      },
    }
  }, [isLoading, v2Data, v3Data, v4Data])
}
