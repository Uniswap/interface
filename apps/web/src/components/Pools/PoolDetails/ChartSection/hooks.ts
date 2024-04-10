import { Token } from '@uniswap/sdk-core'
import { PriceChartData } from 'components/Charts/PriceChart'
import { SingleHistogramData } from 'components/Charts/VolumeChart/renderer'
import { ChartType } from 'components/Charts/utils'
import {
  ChartQueryResult,
  DataQuality,
  checkDataQuality,
  withUTCTimestamp,
} from 'components/Tokens/TokenDetails/ChartSection/util'

import {
  Chain,
  HistoryDuration,
  usePoolPriceHistoryQuery,
  usePoolVolumeHistoryQuery,
} from 'graphql/data/__generated__/types-and-hooks'
import { PoolData } from 'graphql/data/pools/usePoolData'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'

type PDPChartQueryVars = { address: string; chain: Chain; duration: HistoryDuration; isV3: boolean }
export function usePDPPriceChartData(
  variables: PDPChartQueryVars,
  poolData: PoolData | undefined,
  tokenA: Token | undefined,
  tokenB: Token | undefined,
  isReversed: boolean
): ChartQueryResult<PriceChartData, ChartType.PRICE> {
  const { data, loading } = usePoolPriceHistoryQuery({ variables })

  return useMemo(() => {
    const { priceHistory } = data?.v2Pair ?? data?.v3Pool ?? {}
    const referenceToken = isReversed ? tokenA : tokenB

    const entries =
      priceHistory?.map((price) => {
        const value =
          poolData?.token0.address === referenceToken?.address.toLowerCase() ? price.token0Price : price.token1Price

        return {
          time: price.timestamp as UTCTimestamp,
          value,
          open: value,
          high: value,
          low: value,
          close: value,
        }
      }) ?? []

    // TODO(WEB-3769): Append current price based on active tick to entries
    /* const dataQuality = checkDataQuality(entries, ChartType.PRICE, variables.duration) */
    const dataQuality = loading || !priceHistory ? DataQuality.INVALID : DataQuality.VALID

    return { chartType: ChartType.PRICE, entries, loading, dataQuality }
  }, [data?.v2Pair, data?.v3Pool, isReversed, loading, poolData?.token0.address, tokenA, tokenB])
}

export function usePDPVolumeChartData(
  variables: PDPChartQueryVars
): ChartQueryResult<SingleHistogramData, ChartType.VOLUME> {
  const { data, loading } = usePoolVolumeHistoryQuery({ variables })

  return useMemo(() => {
    const { historicalVolume } = data?.v2Pair ?? data?.v3Pool ?? {}
    const entries = historicalVolume?.map(withUTCTimestamp) ?? []

    const dataQuality = checkDataQuality(entries, ChartType.VOLUME, variables.duration)

    return { chartType: ChartType.VOLUME, entries, loading, dataQuality }
  }, [data?.v2Pair, data?.v3Pool, loading, variables.duration])
}
