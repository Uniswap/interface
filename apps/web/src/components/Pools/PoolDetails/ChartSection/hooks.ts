/* eslint-disable import/no-unused-modules */
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { PoolData } from 'appGraphql/data/pools/usePoolData'
import { useRingPoolQuery } from 'appGraphql/data/ring/useRingPoolQuery'
import { RingHistoryDuration } from 'appGraphql/data/util'
import { PriceChartData } from 'components/Charts/PriceChart'
import { SingleHistogramData } from 'components/Charts/VolumeChart/renderer'
import { ChartType } from 'components/Charts/utils'
import {
  ChartQueryResult,
  DataQuality,
  checkDataQuality,
  withUTCTimestamp,
  withUTCTimestampPool,
} from 'components/Tokens/TokenDetails/ChartSection/util'
import { ZERO_ADDRESS } from 'constants/misc'
import { PDPChartQueryVars, PDPRingChartQueryVars, usePoolPriceChartData } from 'hooks/usePoolPriceChartData'
import { UTCTimestamp } from 'lightweight-charts'
import { OptionalCurrency } from 'pages/Pool/Positions/create/types'
import { useMemo } from 'react'
import {
  TimestampedAmount,
  TimestampedPoolPrice,
  TokenStandard,
  usePoolVolumeHistoryQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { isSameAddress } from 'utilities/src/addresses'

export function usePDPPriceChartData(
  variables: PDPChartQueryVars,
  poolData: PoolData | undefined,
  tokenA: OptionalCurrency,
  protocolVersion: ProtocolVersion,
): ChartQueryResult<PriceChartData, ChartType.PRICE> {
  return usePoolPriceChartData(
    variables,
    tokenA,
    protocolVersion,
    poolData?.token0?.address ?? (poolData?.token0?.standard === TokenStandard.Native ? ZERO_ADDRESS : ''),
  )
}

export function usePDPVolumeChartData(
  variables: PDPChartQueryVars,
): ChartQueryResult<SingleHistogramData, ChartType.VOLUME> {
  const { data, loading } = usePoolVolumeHistoryQuery({
    variables,
    skip: !variables.addressOrId || variables.addressOrId === '',
  })

  return useMemo(() => {
    const { historicalVolume } = data?.v2Pair ?? data?.v3Pool ?? data?.v4Pool ?? {}
    const entries =
      historicalVolume?.filter((amt): amt is TimestampedAmount => amt !== null).map(withUTCTimestamp) ?? []

    const dataQuality = checkDataQuality(entries, ChartType.VOLUME, variables.duration)

    return { chartType: ChartType.VOLUME, entries, loading, dataQuality }
  }, [data?.v2Pair, data?.v3Pool, data?.v4Pool, loading, variables.duration])
}

export function useRingPDPPriceChartData(variables: PDPRingChartQueryVars, sortedCurrencyAAddress: string): any {
  const { data, loading } = useRingPoolQuery({
    poolId: variables.addressOrId,
    chain: variables.chain,
    skip: !variables.addressOrId || variables.addressOrId === '',
  })

  const nowTimestamp = useMemo(() => Math.floor(Date.now() / 1000), [])
  const SECONDS_IN_DAY = 86400

  return useMemo(() => {
    const { dayData, hourData, token0 } = data?.v2Pair ?? data?.v3Pool ?? data?.v4Pool ?? {}

    const priceHistory =
      variables.duration === RingHistoryDuration.Day
        ? hourData?.items
            .map(withUTCTimestampPool)
            .filter((v: any) => v !== undefined && Number(v.time) >= nowTimestamp - SECONDS_IN_DAY) ?? []
        : variables.duration === RingHistoryDuration.Week
          ? hourData?.items
              .map(withUTCTimestampPool)
              .filter((v: any) => v !== undefined && Number(v.time) >= nowTimestamp - 7 * SECONDS_IN_DAY) ?? []
          : variables.duration === RingHistoryDuration.Month
            ? dayData?.items
                .map(withUTCTimestampPool)
                .filter((v: any) => v !== undefined && Number(v.time) >= nowTimestamp - 30 * SECONDS_IN_DAY) ?? []
            : variables.duration === RingHistoryDuration.Year
              ? dayData?.items
                  .map(withUTCTimestampPool)
                  .filter((v: any) => v !== undefined && Number(v.time) >= nowTimestamp - 365 * SECONDS_IN_DAY) ?? []
              : dayData?.items.map(withUTCTimestampPool) ?? []

    const entries =
      priceHistory
        ?.filter((price: any): price is TimestampedPoolPrice => price !== null)
        .map((price: any) => {
          const value = isSameAddress(sortedCurrencyAAddress, token0?.address)
            ? Number(price?.token0Price)
            : Number(price?.token1Price)

          return {
            time: price.timestamp as UTCTimestamp,
            value,
            open: value,
            high: value,
            low: value,
            close: value,
          }
        })
        .sort((a: any, b: any) => a.time - b.time) ?? []

    // TODO(WEB-3769): Append current price based on active tick to entries
    /* const dataQuality = checkDataQuality(entries, ChartType.PRICE, variables.duration) */
    const dataQuality = loading || !priceHistory || !priceHistory.length ? DataQuality.INVALID : DataQuality.VALID

    return { chartType: ChartType.PRICE, entries, loading, dataQuality }
  }, [data?.v2Pair, data?.v3Pool, data?.v4Pool, variables.duration, loading, nowTimestamp, sortedCurrencyAAddress])
}

export function useRingPDPVolumeChartData(
  variables: PDPRingChartQueryVars,
): ChartQueryResult<SingleHistogramData, ChartType.VOLUME> {
  const { data, loading } = useRingPoolQuery({
    poolId: variables.addressOrId,
    chain: variables.chain,
    skip: !variables.addressOrId || variables.addressOrId === '',
  })

  const nowTimestamp = useMemo(() => Math.floor(Date.now() / 1000), [])
  const SECONDS_IN_HOUR = 3600
  const SECONDS_IN_DAY = 86400

  return useMemo(() => {
    const historicalVolume = data?.v2Pair ?? data?.v3Pool ?? data?.v4Pool ?? {}

    const baseHourItems = historicalVolume.hourData?.items?.map(withUTCTimestampPool) ?? []
    const baseDayItems = historicalVolume.dayData?.items?.map(withUTCTimestampPool) ?? []

    let historicalVolumes: any[] = []

    if (variables.duration === RingHistoryDuration.Day) {
      historicalVolumes = baseHourItems.filter((v: any) => v && Number(v.time) >= nowTimestamp - SECONDS_IN_DAY)
    } else if (variables.duration === RingHistoryDuration.Week) {
      const weekData = baseHourItems.filter((v: any) => v && Number(v.time) >= nowTimestamp - 7 * SECONDS_IN_DAY)

      const FOUR_HOURS = 4 * SECONDS_IN_HOUR
      const aggregated: any[] = []
      let bucketStart: number | null = null
      let sum = 0

      for (const item of weekData.sort((a: any, b: any) => a.time - b.time)) {
        if (bucketStart === null) {
          bucketStart = item.time
          sum = item.value
        } else if (item.time < bucketStart + FOUR_HOURS) {
          sum += item.value
        } else {
          aggregated.push({
            ...item,
            time: bucketStart,
            timestamp: bucketStart,
            value: sum,
            volumeUSD: sum,
          })
          bucketStart = item.time
          sum = item.value
        }
      }

      if (bucketStart !== null) {
        aggregated.push({
          time: bucketStart,
          timestamp: bucketStart,
          value: sum,
          volumeUSD: sum,
        })
      }

      historicalVolumes = aggregated
    } else if (variables.duration === RingHistoryDuration.Month) {
      historicalVolumes = baseDayItems.filter((v: any) => v && Number(v.time) >= nowTimestamp - 30 * SECONDS_IN_DAY)
    } else if (variables.duration === RingHistoryDuration.Year) {
      const yearData = baseDayItems.filter((v: any) => v && Number(v.time) >= nowTimestamp - 365 * SECONDS_IN_DAY)

      const SEVEN_DAYS = 7 * SECONDS_IN_DAY
      const aggregated: any[] = []
      let bucketStart: number | null = null
      let sum = 0

      for (const item of yearData.sort((a: any, b: any) => a.time - b.time)) {
        if (bucketStart === null) {
          bucketStart = item.time
          sum = item.value
        } else if (item.time < bucketStart + SEVEN_DAYS) {
          sum += item.value
        } else {
          aggregated.push({
            ...item,
            time: bucketStart,
            timestamp: bucketStart,
            value: sum,
            volumeUSD: sum,
          })
          bucketStart = item.time
          sum = item.value
        }
      }

      if (bucketStart !== null) {
        aggregated.push({
          time: bucketStart,
          timestamp: bucketStart,
          value: sum,
          volumeUSD: sum,
        })
      }

      historicalVolumes = aggregated
    } else {
      historicalVolumes = baseDayItems
    }

    const entries = historicalVolumes.sort((a: any, b: any) => a.timestamp - b.timestamp)
    const dataQuality = checkDataQuality(entries, ChartType.VOLUME, variables.duration)

    return { chartType: ChartType.VOLUME, entries, loading, dataQuality }
  }, [data, loading, nowTimestamp, variables])
}
