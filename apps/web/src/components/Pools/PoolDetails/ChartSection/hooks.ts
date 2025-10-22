import { GraphQLApi } from '@universe/api'
import { ChartType } from 'components/Charts/utils'
import { SingleHistogramData } from 'components/Charts/VolumeChart/renderer'
import { ChartQueryResult, checkDataQuality, withUTCTimestamp } from 'components/Tokens/TokenDetails/ChartSection/util'
import { PDPChartQueryVars } from 'hooks/usePoolPriceChartData'
import { useMemo } from 'react'

export function usePDPVolumeChartData({
  variables,
}: {
  variables: PDPChartQueryVars & { addressOrId: string }
}): ChartQueryResult<SingleHistogramData, ChartType.VOLUME> {
  const { data, loading } = GraphQLApi.usePoolVolumeHistoryQuery({
    variables,
    skip: !variables.addressOrId || variables.addressOrId === '',
  })

  return useMemo(() => {
    const { historicalVolume } = data?.v2Pair ?? data?.v3Pool ?? data?.v4Pool ?? {}
    const entries =
      historicalVolume?.filter((amt): amt is GraphQLApi.TimestampedAmount => amt !== undefined).map(withUTCTimestamp) ??
      []

    const dataQuality = checkDataQuality({ data: entries, chartType: ChartType.VOLUME, duration: variables.duration })

    return { chartType: ChartType.VOLUME, entries, loading, dataQuality }
  }, [data?.v2Pair, data?.v3Pool, data?.v4Pool, loading, variables.duration])
}
