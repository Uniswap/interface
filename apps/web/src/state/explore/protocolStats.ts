// eslint-disable-next-line no-restricted-imports
import { TimestampedAmount } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { StackedLineData } from 'components/Charts/StackedLineChart'
import { StackedHistogramData } from 'components/Charts/VolumeChart/renderer'
import { ChartType } from 'components/Charts/utils'
import { checkDataQuality } from 'components/Tokens/TokenDetails/ChartSection/util'
import { UTCTimestamp } from 'lightweight-charts'
import { useContext, useMemo } from 'react'
import { ExploreContext } from 'state/explore'
import { HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

function mapDataByTimestamp(
  v2Data?: TimestampedAmount[],
  v3Data?: TimestampedAmount[],
): Record<number, Record<string, number>> {
  const dataByTime: Record<number, Record<string, number>> = {}
  v2Data?.forEach((v2Point) => {
    const timestamp = Number(v2Point.timestamp)
    dataByTime[timestamp] = { ['v2']: Number(v2Point.value), ['v3']: 0 }
  })
  v3Data?.forEach((v3Point) => {
    const timestamp = Number(v3Point.timestamp)
    if (!dataByTime[timestamp]) {
      dataByTime[timestamp] = { ['v2']: 0, ['v3']: Number(v3Point.value) }
    } else {
      dataByTime[timestamp]['v3'] = Number(v3Point.value)
    }
  })
  return dataByTime
}

export function useHistoricalProtocolVolume(duration: HistoryDuration) {
  const {
    protocolStats: { data, isLoading },
  } = useContext(ExploreContext)
  let v3Data: TimestampedAmount[] | undefined
  let v2Data: TimestampedAmount[] | undefined
  switch (duration) {
    case HistoryDuration.Max:
      v2Data = data?.historicalProtocolVolume?.Max?.v2
      v3Data = data?.historicalProtocolVolume?.Max?.v3
      break
    case HistoryDuration.Year:
      v2Data = data?.historicalProtocolVolume?.Year?.v2
      v3Data = data?.historicalProtocolVolume?.Year?.v3
      break
    default:
      v2Data = data?.historicalProtocolVolume?.Month?.v2
      v3Data = data?.historicalProtocolVolume?.Month?.v3
      break
  }

  return useMemo(() => {
    const dataByTime = mapDataByTimestamp(v2Data, v3Data)

    const entries = Object.entries(dataByTime).reduce((acc, [timestamp, values]) => {
      acc.push({
        time: Number(timestamp) as UTCTimestamp,
        values: {
          ['SUBGRAPH_V2']: values['v2'],
          ['SUBGRAPH_V3']: values['v3'],
        },
      })
      return acc
    }, [] as StackedHistogramData[])

    const dataQuality = checkDataQuality(entries, ChartType.VOLUME, duration)
    return { chartType: ChartType.VOLUME, entries, loading: isLoading, dataQuality }
  }, [duration, isLoading, v2Data, v3Data])
}

export function useDailyProtocolTVL() {
  const {
    protocolStats: { data, isLoading },
  } = useContext(ExploreContext)
  const v3Data = data?.dailyProtocolTvl?.v3
  const v2Data = data?.dailyProtocolTvl?.v2

  return useMemo(() => {
    const dataByTime = mapDataByTimestamp(v2Data, v3Data)
    const entries = Object.entries(dataByTime).map(([timestamp, values]) => ({
      time: Number(timestamp),
      values: [values['v2'], values['v3']],
    })) as StackedLineData[]

    const dataQuality = checkDataQuality(entries, ChartType.TVL, HistoryDuration.Year)
    return { chartType: ChartType.TVL, entries, loading: isLoading, dataQuality }
  }, [isLoading, v2Data, v3Data])
}
