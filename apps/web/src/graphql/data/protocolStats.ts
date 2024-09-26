import { StackedLineData } from 'components/Charts/StackedLineChart'
import { StackedHistogramData } from 'components/Charts/VolumeChart/renderer'
import { ChartType } from 'components/Charts/utils'
import { ChartQueryResult, checkDataQuality } from 'components/Tokens/TokenDetails/ChartSection/util'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
import {
  Chain,
  HistoryDuration,
  PriceSource,
  ProtocolVersion,
  TimestampedAmount,
  useDailyProtocolTvlQuery,
  useHistoricalProtocolVolumeQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

function mapDataByTimestamp(
  v2Data?: readonly TimestampedAmount[],
  v3Data?: readonly TimestampedAmount[],
): Record<number, Record<ProtocolVersion, number>> {
  const dataByTime: Record<number, Record<ProtocolVersion, number>> = {}
  v2Data?.forEach((v2Point) => {
    const timestamp = v2Point.timestamp
    dataByTime[timestamp] = { [ProtocolVersion.V2]: v2Point.value, [ProtocolVersion.V3]: 0, [ProtocolVersion.V4]: 0 }
  })
  v3Data?.forEach((v3Point) => {
    const timestamp = v3Point.timestamp
    if (!dataByTime[timestamp]) {
      dataByTime[timestamp] = { [ProtocolVersion.V4]: 0, [ProtocolVersion.V2]: 0, [ProtocolVersion.V3]: v3Point.value }
    } else {
      dataByTime[timestamp][ProtocolVersion.V3] = v3Point.value
    }
  })
  return dataByTime
}

export function useHistoricalProtocolVolume(
  chain: Chain,
  duration: HistoryDuration,
): ChartQueryResult<StackedHistogramData, ChartType.VOLUME> {
  const isWindowVisible = useIsWindowVisible()
  const isRestExploreEnabled = useFeatureFlag(FeatureFlags.RestExplore)
  const { data: queryData, loading } = useHistoricalProtocolVolumeQuery({
    variables: { chain, duration },
    skip: !isWindowVisible || isRestExploreEnabled,
  })

  return useMemo(() => {
    const dataByTime = mapDataByTimestamp(queryData?.v2HistoricalProtocolVolume, queryData?.v3HistoricalProtocolVolume)

    const entries = Object.entries(dataByTime).reduce((acc, [timestamp, values]) => {
      acc.push({
        time: Number(timestamp) as UTCTimestamp,
        values: {
          [PriceSource.SubgraphV2]: values[ProtocolVersion.V2],
          [PriceSource.SubgraphV3]: values[ProtocolVersion.V3],
          [PriceSource.SubgraphV4]: values[ProtocolVersion.V4],
        },
      })
      return acc
    }, [] as StackedHistogramData[])

    const dataQuality = checkDataQuality(entries, ChartType.VOLUME, duration)
    return { chartType: ChartType.VOLUME, entries, loading, dataQuality }
  }, [duration, loading, queryData?.v2HistoricalProtocolVolume, queryData?.v3HistoricalProtocolVolume])
}

export function useDailyProtocolTVL(chain: Chain): ChartQueryResult<StackedLineData, ChartType.TVL> {
  const isWindowVisible = useIsWindowVisible()
  const isRestExploreEnabled = useFeatureFlag(FeatureFlags.RestExplore)
  const { data: queryData, loading } = useDailyProtocolTvlQuery({
    variables: { chain },
    skip: !isWindowVisible || isRestExploreEnabled,
  })

  return useMemo(() => {
    const dataByTime = mapDataByTimestamp(queryData?.v2DailyProtocolTvl, queryData?.v3DailyProtocolTvl)
    const entries = Object.entries(dataByTime).map(([timestamp, values]) => ({
      time: Number(timestamp),
      values: [values[ProtocolVersion.V2], values[ProtocolVersion.V3]],
    })) as StackedLineData[]

    const dataQuality = checkDataQuality(entries, ChartType.TVL, HistoryDuration.Year)
    return { chartType: ChartType.TVL, entries, loading, dataQuality }
  }, [loading, queryData?.v2DailyProtocolTvl, queryData?.v3DailyProtocolTvl])
}
