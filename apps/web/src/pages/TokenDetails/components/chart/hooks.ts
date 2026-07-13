import { GraphQLApi } from '@universe/api'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
import { StackedLineData } from '~/components/Charts/StackedLineChart'
import {
  ChartQueryResult,
  ChartType,
  checkDataQuality,
  getCurrentUTCTimestamp,
  withUTCTimestamp,
} from '~/components/Charts/utils'
import { SingleHistogramData } from '~/components/Charts/VolumeChart/utils'
import type { TokenPriceChartQueryVariables } from '~/hooks/useTokenPriceChartData'

export type TDPChartQueryVariables = TokenPriceChartQueryVariables

export const TDP_CHART_APOLLO_QUERY_NAMES = ['TokenHistoricalVolumes', 'TokenHistoricalTvls'] as const

export function useTDPVolumeChartData({
  variables,
  skip,
}: {
  variables: TDPChartQueryVariables
  skip: boolean
}): ChartQueryResult<SingleHistogramData, ChartType.VOLUME> {
  const { data, loading } = GraphQLApi.useTokenHistoricalVolumesQuery({
    variables,
    skip,
  })
  const historicalVolume = data?.token?.market?.historicalVolume

  return useMemo(() => {
    const entries =
      historicalVolume
        ?.filter((v): v is GraphQLApi.PriceHistoryFallbackFragment => v !== undefined)
        .map(withUTCTimestamp) ?? []
    const dataQuality = checkDataQuality({ data: entries, chartType: ChartType.VOLUME, duration: variables.duration })
    return { chartType: ChartType.VOLUME, entries, loading, dataQuality }
  }, [historicalVolume, loading, variables.duration])
}

function toStackedLineData(entry: { timestamp: number; value: number }): StackedLineData {
  return { values: [entry.value], time: entry.timestamp as UTCTimestamp }
}

export function useTDPTVLChartData(
  variables: TDPChartQueryVariables,
  skip: boolean,
): ChartQueryResult<StackedLineData, ChartType.TVL> {
  const { data, loading } = GraphQLApi.useTokenHistoricalTvlsQuery({ variables, skip })
  return useMemo(() => {
    const { historicalTvl, totalValueLocked } = data?.token?.market ?? {}
    const entries =
      historicalTvl
        ?.filter((v): v is GraphQLApi.PriceHistoryFallbackFragment => v !== undefined)
        .map(toStackedLineData) ?? []
    const currentTvl = totalValueLocked?.value

    // Append current tvl to end of array to ensure data freshness and that each time period ends with same tvl
    if (currentTvl && entries.length > 1) {
      const lastEntry = entries[entries.length - 1]
      const secondToLastEntry = entries[entries.length - 2]
      const granularity = lastEntry.time - secondToLastEntry.time

      const time = getCurrentUTCTimestamp()
      // If the current tvl falls within the last entry's time window, update the last entry's tvl
      if (time - lastEntry.time < granularity) {
        lastEntry.time = time
        lastEntry.values = [currentTvl]
      } else {
        // If the current tvl falls outside the last entry's time window, add it as a new entry
        entries.push({ time, values: [currentTvl] })
      }
    }

    const dataQuality = checkDataQuality({ data: entries, chartType: ChartType.TVL, duration: variables.duration })
    return { chartType: ChartType.TVL, entries, loading, dataQuality }
  }, [data?.token?.market, loading, variables.duration])
}
