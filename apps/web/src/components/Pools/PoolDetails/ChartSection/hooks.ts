import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { PoolData } from 'appGraphql/data/pools/usePoolData'
import { PriceChartData } from 'components/Charts/PriceChart'
import { SingleHistogramData } from 'components/Charts/VolumeChart/renderer'
import { ChartType } from 'components/Charts/utils'
import { ChartQueryResult, checkDataQuality, withUTCTimestamp } from 'components/Tokens/TokenDetails/ChartSection/util'
import { ZERO_ADDRESS } from 'constants/misc'
import { PDPChartQueryVars, usePoolPriceChartData } from 'hooks/usePoolPriceChartData'
import { OptionalCurrency } from 'pages/Pool/Positions/create/types'
import { useMemo } from 'react'
import {
  TimestampedAmount,
  TokenStandard,
  usePoolVolumeHistoryQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

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
