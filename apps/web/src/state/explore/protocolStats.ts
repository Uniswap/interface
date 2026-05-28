import { TimestampedAmount } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { useContext, useMemo } from 'react'
import { ExploreContext } from 'state/explore'

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

  const v2Data: TimestampedAmount[] | undefined = data?.historicalProtocolVolume?.Month?.v2
  const v3Data: TimestampedAmount[] | undefined = data?.historicalProtocolVolume?.Month?.v3
  const v4Data: TimestampedAmount[] | undefined = data?.historicalProtocolVolume?.Month?.v4

  const dataByTime = mapDataByTimestamp(v2Data, v3Data, v4Data)

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

  const totalLatest = (latestVolumes.v2 || 0) + (latestVolumes.v3 || 0) + (latestVolumes.v4 || 0)
  const totalPrevious = (previousVolumes.v2 || 0) + (previousVolumes.v3 || 0) + (previousVolumes.v4 || 0)

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

  const v2Data: TimestampedAmount[] | undefined = data?.dailyProtocolTvl?.v2
  const v3Data: TimestampedAmount[] | undefined = data?.dailyProtocolTvl?.v3
  const v4Data: TimestampedAmount[] | undefined = data?.dailyProtocolTvl?.v4

  return useMemo(() => {
    const dataByTime = mapDataByTimestamp(v2Data, v3Data, v4Data)
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

    const totalTVL = latest.v2 + latest.v3 + latest.v4
    const previousTotal = previous.v2 + previous.v3 + previous.v4

    const computeChangePercent = (latestVal: number, previousVal: number) =>
      previousVal === 0 ? 0 : ((latestVal - previousVal) / previousVal) * 100

    // Combined protocol changes
    const totalChangePercent = computeChangePercent(totalTVL, previousTotal)

    // Individual protocol changes
    const v2Change = computeChangePercent(latest.v2, previous.v2)
    const v3Change = computeChangePercent(latest.v3, previous.v3)
    const v4Change = computeChangePercent(latest.v4, previous.v4)

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

const SECONDS_IN_DAY = 86400
const SECONDS_IN_HOUR = 3600

function sumRolling24HVolume(factory: any) {
  if (!factory?.hourData?.items) {
    return 0
  }
  const nowSec = Math.floor(Date.now() / 1000)
  const cutoffSec = nowSec - 24 * SECONDS_IN_HOUR

  return factory.hourData.items
    .filter((x: any) => Number(x.hourId) * SECONDS_IN_HOUR >= cutoffSec)
    .reduce((acc: number, x: any) => acc + Number(x.volumeUSDUntracked ?? 0), 0)
}

export function use24hRingProtocolVolume() {
  const {
    ringProtocolStats: { data, isLoading },
  } = useContext(ExploreContext)

  const currentDayId = Math.floor(Date.now() / 1000 / SECONDS_IN_DAY)
  const prevDayIdStr = String(currentDayId - 1)
  const prevPrevDayIdStr = String(currentDayId - 2)

  return useMemo(() => {
    const factoryV2 = data?.factorys?.items?.find((f: any) => f.id === 'factory-v2')
    const factoryV3 = data?.factorys?.items?.find((f: any) => f.id === 'factory-v3')
    const factoryV4 = data?.factorys?.items?.find((f: any) => f.id === 'factory-v4')

    // ===== build day maps =====
    const v2Map = new Map<string, any>()
    const v3Map = new Map<string, any>()
    const v4Map = new Map<string, any>()

    factoryV2?.dayData?.items?.forEach((x: any) => v2Map.set(x.dayId, x))
    factoryV3?.dayData?.items?.forEach((x: any) => v3Map.set(x.dayId, x))
    factoryV4?.dayData?.items?.forEach((x: any) => v4Map.set(x.dayId, x))

    // ===== current day (yesterday) =====
    const v2Current = v2Map.get(prevDayIdStr) ?? {}
    const v3Current = v3Map.get(prevDayIdStr) ?? {}
    const v4Current = v4Map.get(prevDayIdStr) ?? {}

    const protocolVolumeUSD =
      Number(v2Current.volumeUSDUntracked ?? 0) +
      Number(v3Current.volumeUSDUntracked ?? 0) +
      Number(v4Current.volumeUSDUntracked ?? 0)

    const v2TVL = Number(v2Current.tvlUSD ?? 0)
    const v3TVL = Number(v3Current.tvlUSD ?? 0)
    const v4TVL = Number(v4Current.tvlUSD ?? 0)

    const protocolTVL = v2TVL + v3TVL + v4TVL

    // ===== previous day =====
    const v2Prev = v2Map.get(prevPrevDayIdStr) ?? {}
    const v3Prev = v3Map.get(prevPrevDayIdStr) ?? {}
    const v4Prev = v4Map.get(prevPrevDayIdStr) ?? {}

    const protocolPrevVolumeUSD =
      Number(v2Prev.volumeUSDUntracked ?? 0) +
      Number(v3Prev.volumeUSDUntracked ?? 0) +
      Number(v4Prev.volumeUSDUntracked ?? 0)

    const volumeChange =
      protocolPrevVolumeUSD === 0 ? 0 : ((protocolVolumeUSD - protocolPrevVolumeUSD) / protocolPrevVolumeUSD) * 100

    const v2PrevTVL = Number(v2Prev.tvlUSD ?? 0)
    const v3PrevTVL = Number(v3Prev.tvlUSD ?? 0)
    const v4PrevTVL = Number(v4Prev.tvlUSD ?? 0)

    const protocolPrevTVL = v2PrevTVL + v3PrevTVL + v4PrevTVL
    const tvlChange = protocolPrevTVL === 0 ? 0 : ((protocolTVL - protocolPrevTVL) / protocolPrevTVL) * 100

    const v2TVLChange = v2PrevTVL === 0 ? 0 : ((v2TVL - v2PrevTVL) / v2PrevTVL) * 100
    const v3TVLChange = v3PrevTVL === 0 ? 0 : ((v3TVL - v3PrevTVL) / v3PrevTVL) * 100
    const v4TVLChange = v4PrevTVL === 0 ? 0 : ((v4TVL - v4PrevTVL) / v4PrevTVL) * 100

    const protocolPrevRevenueUSD =
      Number(v2Prev.feesUSD ?? 0) + Number(v3Prev.feesUSD ?? 0) + Number(v4Prev.feesUSD ?? 0)
    const protocolRevenueUSD =
      Number(v2Current.feesUSD ?? 0) + Number(v3Current.feesUSD ?? 0) + Number(v4Current.feesUSD ?? 0)
    const revenueChange =
      protocolPrevRevenueUSD === 0 ? 0 : ((protocolRevenueUSD - protocolPrevRevenueUSD) / protocolPrevRevenueUSD) * 100

    // ===== rolling 24h volume (time-safe) =====
    const v2_24HVolume = sumRolling24HVolume(factoryV2)
    const v3_24HVolume = sumRolling24HVolume(factoryV3)
    const v4_24HVolume = sumRolling24HVolume(factoryV4)
    const protocol24HVolumeUSD = v2_24HVolume + v3_24HVolume + v4_24HVolume

    return {
      isLoading,
      totalVolume: protocolVolumeUSD,
      totalVolumeChangePercent: volumeChange,
      // ===== rolling 24h =====
      protocol24HVolumeUSD,
      protocolVolumes: {
        v2: v2Current.volumeUSDUntracked ?? 0,
        v3: v3Current.volumeUSDUntracked ?? 0,
        v4: v4Current.volumeUSDUntracked ?? 0,
      },
      protocolTVL: {
        v2: v2TVL,
        v3: v3TVL,
        v4: v4TVL,
      },
      totalTVL: protocolTVL,
      totalTVLChangePercent: tvlChange,
      protocolChangePercent: {
        v2: v2TVLChange,
        v3: v3TVLChange,
        v4: v4TVLChange,
      },
      revenue: {
        v2: v2Current.feesUSD ?? 0,
        v3: v3Current.feesUSD ?? 0,
        v4: v4Current.feesUSD ?? 0,
      },
      totalRevenue: protocolRevenueUSD,
      totalRevenueChangePercent: revenueChange,
    }
  }, [data, isLoading, prevDayIdStr, prevPrevDayIdStr])
}
