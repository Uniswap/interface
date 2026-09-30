import { type PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { GetTokenHistoryVolumeResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
import { getGetTokenHistoryVolumeQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { toRestHistoryDuration } from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { isQueryLoading } from 'utilities/src/reactQuery/isQueryLoading'
import { ChartQueryResult, ChartType, checkDataQuality } from '~/components/Charts/utils'
import { SingleHistogramData } from '~/components/Charts/VolumeChart/utils'
import { useRestHistoryTarget } from '~/hooks/useRestHistoryTarget'
import type { TDPChartQueryVariables } from '~/pages/TokenDetails/components/chart/TDPChartState'

function selectVolumeEntries(data: PlainMessage<GetTokenHistoryVolumeResponse> | undefined): SingleHistogramData[] {
  return (
    data?.buckets
      .filter((bucket): bucket is typeof bucket & { volumeUsd: number } => bucket.volumeUsd !== undefined)
      .map((bucket) => ({ time: Number(bucket.timestamp) as UTCTimestamp, value: bucket.volumeUsd })) ?? []
  )
}

export function useTDPVolumeChartData({
  variables,
  skip,
}: {
  variables: TDPChartQueryVariables
  skip: boolean
}): ChartQueryResult<SingleHistogramData, ChartType.VOLUME> {
  const target = useRestHistoryTarget(variables)
  const volumeQuery = useQuery(
    getGetTokenHistoryVolumeQueryOptions({
      params: { target, duration: toRestHistoryDuration(variables.duration) },
      enabled: !skip && !!target,
      keepPreviousData: false,
      select: selectVolumeEntries,
    }),
  )
  const restEntries = volumeQuery.data
  const restLoading = isQueryLoading(volumeQuery)
  const restIsError = volumeQuery.isError

  return useMemo(() => {
    const entries = restEntries ?? []
    const dataQuality = checkDataQuality({ data: entries, chartType: ChartType.VOLUME, duration: variables.duration })
    return { chartType: ChartType.VOLUME, entries, loading: restLoading, dataQuality, isError: restIsError }
  }, [restEntries, restLoading, restIsError, variables.duration])
}
