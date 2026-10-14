import { useQuery } from '@tanstack/react-query'
import type { ChainId } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { GetPoolHistoryVolumeRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import { ChartQueryResult, ChartType, checkDataQuality } from '~/components/Charts/utils'
import { SingleHistogramData } from '~/components/Charts/VolumeChart/utils'
import {
  toLiquidityHistoryDuration,
  versionFromVars,
  type PDPChartQueryVars,
} from '~/features/Liquidity/charts/liquidityServiceHistoryVars'

/**
 * Pool Details Page volume-chart data source backed by the liquidity-service `GetPoolHistoryVolume`
 * endpoint. `GetPoolHistoryVolume` requires the protocol version (derived from the isV2/isV3/isV4
 * vars).
 */
export function useLiquidityServicePoolVolumeChartData({
  variables,
  disabled = false,
}: {
  variables: PDPChartQueryVars & { addressOrId: string }
  disabled?: boolean
}): ChartQueryResult<SingleHistogramData, ChartType.VOLUME> {
  const version = versionFromVars(variables)

  const { data, isLoading: loading } = useQuery(
    liquidityQueries.getPoolHistoryVolume({
      params: version
        ? new GetPoolHistoryVolumeRequest({
            pool: {
              chainId: variables.chainId as number as ChainId,
              addressOrId: variables.addressOrId,
              version,
            },
            duration: toLiquidityHistoryDuration(variables.duration),
          })
        : undefined,
      enabled: !disabled && !!variables.addressOrId && version !== undefined,
    }),
  )

  return useMemo(() => {
    const entries: SingleHistogramData[] =
      data?.buckets.map((bucket) => ({
        value: bucket.volumeUsd,
        feesUsd: bucket.feeUsd,
        time: Number(bucket.timestamp) as UTCTimestamp,
      })) ?? []

    const dataQuality = checkDataQuality({ data: entries, chartType: ChartType.VOLUME, duration: variables.duration })

    return { chartType: ChartType.VOLUME, entries, loading, dataQuality }
  }, [data?.buckets, loading, variables.duration])
}
