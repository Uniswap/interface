import { ApolloError } from '@apollo/client'
import { StackedLineData } from 'components/Charts/StackedLineChart'
import { StackedHistogramData } from 'components/Charts/VolumeChart/renderer'
import gql from 'graphql-tag'
import {
  Chain,
  HistoryDuration,
  PriceSource,
  ProtocolVersion,
  TimestampedAmount,
  useDailyProtocolTvlQuery,
  useHistoricalProtocolVolumeQuery,
} from 'graphql/data/__generated__/types-and-hooks'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'

gql`
  query HistoricalProtocolVolume($chain: Chain!, $duration: HistoryDuration!) {
    v3HistoricalProtocolVolume: historicalProtocolVolume(chain: $chain, version: V3, duration: $duration) {
      id
      timestamp
      value
    }
    v2HistoricalProtocolVolume: historicalProtocolVolume(chain: $chain, version: V2, duration: $duration) {
      id
      timestamp
      value
    }
  }
  query DailyProtocolTVL($chain: Chain!) {
    v3DailyProtocolTvl: dailyProtocolTvl(chain: $chain, version: V3) {
      id
      timestamp
      value
    }
    v2DailyProtocolTvl: dailyProtocolTvl(chain: $chain, version: V2) {
      id
      timestamp
      value
    }
  }
`

function mapDataByTimestamp(
  v2Data?: readonly TimestampedAmount[],
  v3Data?: readonly TimestampedAmount[]
): Record<number, Record<ProtocolVersion, number>> {
  const dataByTime: Record<number, Record<ProtocolVersion, number>> = {}
  v2Data?.forEach((v2Point) => {
    const timestamp = v2Point.timestamp
    dataByTime[timestamp] = { [ProtocolVersion.V2]: v2Point.value, [ProtocolVersion.V3]: 0 }
  })
  v3Data?.forEach((v3Point) => {
    const timestamp = v3Point.timestamp
    if (!dataByTime[timestamp]) {
      dataByTime[timestamp] = { [ProtocolVersion.V2]: 0, [ProtocolVersion.V3]: v3Point.value }
    } else {
      dataByTime[timestamp][ProtocolVersion.V3] = v3Point.value
    }
  })
  return dataByTime
}

export function useHistoricalProtocolVolume(
  chain: Chain,
  duration: HistoryDuration
): {
  data: StackedHistogramData[]
  loading: boolean
  error?: ApolloError
} {
  const {
    data: queryData,
    loading,
    error,
  } = useHistoricalProtocolVolumeQuery({
    variables: { chain, duration },
  })

  const data = useMemo(() => {
    const dataByTime = mapDataByTimestamp(queryData?.v2HistoricalProtocolVolume, queryData?.v3HistoricalProtocolVolume)

    return Object.entries(dataByTime).reduce((acc, [timestamp, values]) => {
      acc.push({
        time: Number(timestamp) as UTCTimestamp,
        values: {
          [PriceSource.SubgraphV2]: values[ProtocolVersion.V2],
          [PriceSource.SubgraphV3]: values[ProtocolVersion.V3],
        },
      })
      return acc
    }, [] as StackedHistogramData[])
  }, [queryData?.v2HistoricalProtocolVolume, queryData?.v3HistoricalProtocolVolume])

  return { data, loading, error }
}

export function useDailyProtocolTVL(chain: Chain): {
  data: StackedLineData[]
  loading: boolean
  error?: ApolloError
} {
  const {
    data: queryData,
    loading,
    error,
  } = useDailyProtocolTvlQuery({
    variables: { chain },
  })

  const data = useMemo(() => {
    const dataByTime = mapDataByTimestamp(queryData?.v2DailyProtocolTvl, queryData?.v3DailyProtocolTvl)
    return Object.entries(dataByTime).map(([timestamp, values]) => ({
      time: Number(timestamp),
      values: [values[ProtocolVersion.V2], values[ProtocolVersion.V3]],
    })) as StackedLineData[]
  }, [queryData?.v2DailyProtocolTvl, queryData?.v3DailyProtocolTvl])

  return { data, loading, error }
}
