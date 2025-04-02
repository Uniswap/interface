import { TimestampedAmount } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { useContext, useMemo } from 'react'
import { ExploreContext } from 'state/explore'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'

function mapDataByTimestamp(
  v2Data?: TimestampedAmount[],
  v3Data?: TimestampedAmount[],
  v4Data?: TimestampedAmount[],
): Record<number, Record<string, number>> {
  const dataByTime: Record<number, Record<string, number>> = {}
  v2Data?.forEach((v2Point) => {
    const timestamp = Number(v2Point.timestamp)
    dataByTime[timestamp] = { ['v2']: Number(v2Point.value), ['v3']: 0, ['v4']: 0 }
  })
  v3Data?.forEach((v3Point) => {
    const timestamp = Number(v3Point.timestamp)
    if (!dataByTime[timestamp]) {
      dataByTime[timestamp] = { ['v2']: 0, ['v3']: Number(v3Point.value), ['v4']: 0 }
    } else {
      dataByTime[timestamp]['v3'] = Number(v3Point.value)
    }
  })
  v4Data?.forEach((v4Point) => {
    const timestamp = Number(v4Point.timestamp)
    if (!dataByTime[timestamp]) {
      dataByTime[timestamp] = { ['v2']: 0, ['v3']: 0, ['v4']: Number(v4Point.value) }
    } else {
      dataByTime[timestamp]['v4'] = Number(v4Point.value)
    }
  })
  return dataByTime
}

/**
 * Returns:
 * - total 24h volume (sum of all protocols for the latest day)
 * - each protocol’s 24h volume (v2, v3, and v4)
 * - 24hr total volume percentage change
 */
export function use24hProtocolVolume() {
  const {
    protocolStats: { data, isLoading },
  } = useContext(ExploreContext)

  const { value: isV4DataEnabledLoaded, isLoading: isV4DataLoading } = useFeatureFlagWithLoading(FeatureFlags.V4Data)
  const isV4DataEnabled = isV4DataEnabledLoaded || isV4DataLoading

  const v2Data: TimestampedAmount[] | undefined = data?.historicalProtocolVolume?.Month?.v2
  const v3Data: TimestampedAmount[] | undefined = data?.historicalProtocolVolume?.Month?.v3
  const v4Data: TimestampedAmount[] | undefined = data?.historicalProtocolVolume?.Month?.v4

  const dataByTime = mapDataByTimestamp(v2Data, v3Data, isV4DataEnabled ? v4Data : undefined)

  const sortedTimestamps = Object.keys(dataByTime)
    .map(Number)
    .sort((a, b) => b - a)

  // The first two timestamps represent the latest 24h snapshot and the previous one
  const latestTimestamp = sortedTimestamps[0]
  const previousTimestamp = sortedTimestamps[1]

  // Get the volume values for the latest and previous periods; missing values default to 0
  const latestVolumes = useMemo(
    () => dataByTime[latestTimestamp] || { v2: 0, v3: 0, v4: 0 },
    [dataByTime, latestTimestamp],
  )
  const previousVolumes = useMemo(
    () => dataByTime[previousTimestamp] || { v2: 0, v3: 0, v4: 0 },
    [dataByTime, previousTimestamp],
  )

  const totalLatest = (latestVolumes.v2 || 0) + (latestVolumes.v3 || 0) + (isV4DataEnabled ? latestVolumes.v4 || 0 : 0)
  const totalPrevious =
    (previousVolumes.v2 || 0) + (previousVolumes.v3 || 0) + (isV4DataEnabled ? previousVolumes.v4 || 0 : 0)

  const computeChangePercent = (latest: number, previous: number): number => {
    // If previous is 0, we treat the change as 0 to avoid division by zero.
    if (previous === 0) {
      return 0
    }
    return ((latest - previous) / previous) * 100
  }

  const totalChangePercent = computeChangePercent(totalLatest, totalPrevious)

  return useMemo(
    () => ({
      isLoading,
      totalVolume: totalLatest,
      totalChangePercent,
      protocolVolumes: {
        v2: latestVolumes.v2,
        v3: latestVolumes.v3,
        v4: latestVolumes.v4,
      },
    }),
    [isLoading, totalLatest, latestVolumes, totalChangePercent],
  )
}

/**
 * Returns:
 * - total 24h TVL (sum of all protocols for the latest day)
 * - each protocol’s 24h TVL (v2, v3, and v4)
 * - 24hr total TVL percentage change
 * - each protocol’s 24hr TVL percentage change (v2, v3, and v4)
 */
export function useDailyTVLWithChange() {
  const {
    protocolStats: { data, isLoading },
  } = useContext(ExploreContext)

  const { value: isV4DataEnabledLoaded, isLoading: isV4DataLoading } = useFeatureFlagWithLoading(FeatureFlags.V4Data)
  const isV4DataEnabled = isV4DataEnabledLoaded || isV4DataLoading

  const v2Data: TimestampedAmount[] | undefined = data?.dailyProtocolTvl?.v2
  const v3Data: TimestampedAmount[] | undefined = data?.dailyProtocolTvl?.v3
  const v4Data: TimestampedAmount[] | undefined = data?.dailyProtocolTvl?.v4

  return useMemo(() => {
    const dataByTime = mapDataByTimestamp(v2Data, v3Data, isV4DataEnabled ? v4Data : undefined)
    const sortedTimestamps = Object.keys(dataByTime)
      .map(Number)
      .sort((a, b) => b - a)

    // If there’s no data available, return defaults
    if (sortedTimestamps.length === 0) {
      return {
        isLoading,
        totalTVL: 0,
        totalChangePercent: 0,
        protocolTVL: { v2: 0, v3: 0, v4: 0 },
        protocolChangePercent: { v2: 0, v3: 0, v4: 0 },
      }
    }

    // Latest snapshot
    const latestTimestamp = sortedTimestamps[0]
    const latest = dataByTime[latestTimestamp]

    // Previous snapshot – if available; if not, default to zero values
    const previousTimestamp = sortedTimestamps.length > 1 ? sortedTimestamps[1] : null
    const previous = previousTimestamp ? dataByTime[previousTimestamp] : { v2: 0, v3: 0, v4: 0 }

    const protocolTVL = {
      v2: latest.v2,
      v3: latest.v3,
      v4: latest.v4,
    }

    const totalTVL = latest.v2 + latest.v3 + (isV4DataEnabled ? latest.v4 : 0)
    const previousTotal = previous.v2 + previous.v3 + (isV4DataEnabled ? previous.v4 : 0)

    const computeChangePercent = (latestVal: number, previousVal: number) =>
      previousVal === 0 ? 0 : ((latestVal - previousVal) / previousVal) * 100

    // Combined protocol changes
    const totalChangePercent = computeChangePercent(totalTVL, previousTotal)

    // Individual protocol changes
    const v2Change = computeChangePercent(latest.v2, previous.v2)
    const v3Change = computeChangePercent(latest.v3, previous.v3)
    const v4Change = isV4DataEnabled ? computeChangePercent(latest.v4, previous.v4) : 0

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
  }, [isLoading, isV4DataEnabled, v2Data, v3Data, v4Data])
}
