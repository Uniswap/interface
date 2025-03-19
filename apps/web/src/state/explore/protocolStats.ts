import { TimestampedAmount } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { StackedLineData } from 'components/Charts/StackedLineChart'
import { StackedHistogramData } from 'components/Charts/VolumeChart/renderer'
import { ChartType } from 'components/Charts/utils'
import { checkDataQuality } from 'components/Tokens/TokenDetails/ChartSection/util'
import { UTCTimestamp } from 'lightweight-charts'
import { useContext, useMemo } from 'react'
import { ExploreContext } from 'state/explore'
import { HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
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

export function useHistoricalProtocolVolume(duration: HistoryDuration) {
  const {
    protocolStats: { data, isLoading },
  } = useContext(ExploreContext)

  const { value: isV4DataEnabledLoaded, isLoading: isV4DataLoading } = useFeatureFlagWithLoading(FeatureFlags.V4Data)
  const isV4DataEnabled = isV4DataEnabledLoaded || isV4DataLoading
  let v4Data: TimestampedAmount[] | undefined
  let v3Data: TimestampedAmount[] | undefined
  let v2Data: TimestampedAmount[] | undefined
  switch (duration) {
    case HistoryDuration.Max:
      v2Data = data?.historicalProtocolVolume?.Max?.v2
      v3Data = data?.historicalProtocolVolume?.Max?.v3
      v4Data = data?.historicalProtocolVolume?.Max?.v4
      break
    case HistoryDuration.Year:
      v2Data = data?.historicalProtocolVolume?.Year?.v2
      v3Data = data?.historicalProtocolVolume?.Year?.v3
      v4Data = data?.historicalProtocolVolume?.Year?.v4
      break
    default:
      v2Data = data?.historicalProtocolVolume?.Month?.v2
      v3Data = data?.historicalProtocolVolume?.Month?.v3
      v4Data = data?.historicalProtocolVolume?.Month?.v4
      break
  }

  return useMemo(() => {
    const dataByTime = mapDataByTimestamp(v2Data, v3Data, isV4DataEnabled ? v4Data : undefined)

    const entries = Object.entries(dataByTime).reduce((acc, [timestamp, values]) => {
      acc.push({
        time: Number(timestamp) as UTCTimestamp,
        values: {
          ['SUBGRAPH_V2']: values['v2'],
          ['SUBGRAPH_V3']: values['v3'],
          ['SUBGRAPH_V4']: isV4DataEnabled ? values['v4'] : undefined,
        },
      })
      return acc
    }, [] as StackedHistogramData[])

    const dataQuality = checkDataQuality(entries, ChartType.VOLUME, duration)
    return { chartType: ChartType.VOLUME, entries, loading: isLoading, dataQuality }
  }, [duration, isLoading, isV4DataEnabled, v2Data, v3Data, v4Data])
}

export function useDailyProtocolTVL() {
  const {
    protocolStats: { data, isLoading },
  } = useContext(ExploreContext)

  const { value: isV4DataEnabledLoaded, isLoading: isV4DataLoading } = useFeatureFlagWithLoading(FeatureFlags.V4Data)
  const isV4DataEnabled = isV4DataEnabledLoaded || isV4DataLoading
  const v4Data = data?.dailyProtocolTvl?.v4
  const v3Data = data?.dailyProtocolTvl?.v3
  const v2Data = data?.dailyProtocolTvl?.v2

  return useMemo(() => {
    const dataByTime = mapDataByTimestamp(v2Data, v3Data, isV4DataEnabled ? v4Data : undefined)
    const entries = Object.entries(dataByTime).map(([timestamp, values]) => ({
      time: Number(timestamp),
      values: isV4DataEnabled ? [values['v2'], values['v3'], values['v4']] : [values['v2'], values['v3']],
    })) as StackedLineData[]

    const dataQuality = checkDataQuality(entries, ChartType.TVL, HistoryDuration.Year)
    return { chartType: ChartType.TVL, entries, loading: isLoading, dataQuality }
  }, [isLoading, isV4DataEnabled, v2Data, v3Data, v4Data])
}
