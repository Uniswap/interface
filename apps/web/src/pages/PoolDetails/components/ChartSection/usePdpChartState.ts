import { ProtocolVersion as RestProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { useMemo, useState } from 'react'
import { PriceChartData } from '~/components/Charts/PriceChart'
import { SingleHistogramData } from '~/components/Charts/VolumeChart/utils'
import type { PoolData } from '~/data/pools/poolData'
import { TimePeriod, toHistoryDuration } from '~/data/util'
import { useLiquidityServicePoolPriceChartData } from '~/features/Liquidity/charts/useLiquidityServicePoolPriceChartData'
import { useLiquidityServicePoolVolumeChartData } from '~/features/Liquidity/charts/useLiquidityServicePoolVolumeChartData'
import {
  type PoolsDetailsChartType,
  usePdpChartTypeQueryState,
} from '~/pages/PoolDetails/components/ChartSection/chartTypeQueryState'
import { usePoolSpotPrice } from '~/pages/PoolDetails/components/ChartSection/usePoolSpotPrice'
import { ChartQueryResult, ChartType, DataQuality } from '~/utils/charts'

/** Represents a variety of query result shapes, discriminated via additional `chartType` field. */
type ActiveQuery =
  | ChartQueryResult<PriceChartData, ChartType.PRICE>
  | ChartQueryResult<SingleHistogramData, ChartType.VOLUME>
  | ChartQueryResult<undefined, ChartType.LIQUIDITY>

type TDPChartState = {
  timePeriod: TimePeriod
  setTimePeriod: (timePeriod: TimePeriod) => void
  setChartType: (chartType: PoolsDetailsChartType) => void
  selectedChartType: PoolsDetailsChartType
  activeQuery: ActiveQuery
  dataQuality?: DataQuality
  priceEntries?: PriceChartData[]
  volumeEntries?: SingleHistogramData[]
}

export function usePDPChartState({
  poolData,
  isReversed,
  chainId,
  protocolVersion,
}: {
  poolData: PoolData | undefined
  isReversed: boolean
  chainId: UniverseChainId
  protocolVersion: RestProtocolVersion
}): TDPChartState {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.DAY)
  const [selectedChartType, setChartType] = usePdpChartTypeQueryState()

  const isV2 = protocolVersion === RestProtocolVersion.V2

  // DEPTH is a different visualization of the same data as LIQUIDITY — share data fetching.
  const chartType = selectedChartType === ChartType.DEPTH ? ChartType.LIQUIDITY : selectedChartType
  const isV3 = protocolVersion === RestProtocolVersion.V3
  const isV4 = protocolVersion === RestProtocolVersion.V4
  const variables = {
    addressOrId: poolData?.idOrAddress ?? '',
    chainId,
    duration: toHistoryDuration(timePeriod),
    isV4,
    isV3,
    isV2,
  }

  const currentPrice = usePoolSpotPrice({
    poolData,
    isReversed,
    chainId,
    version: protocolVersion,
    enabled: chartType === ChartType.PRICE,
  })

  const priceQuery = useLiquidityServicePoolPriceChartData({ variables, priceInverted: isReversed, currentPrice })
  const volumeQuery = useLiquidityServicePoolVolumeChartData({ variables })

  return useMemo(() => {
    const activeQuery =
      chartType === ChartType.PRICE
        ? priceQuery
        : chartType === ChartType.VOLUME
          ? volumeQuery
          : {
              chartType: ChartType.LIQUIDITY as const,
              entries: [],
              loading: false,
              dataQuality: DataQuality.VALID,
            }

    return {
      timePeriod,
      setTimePeriod,
      setChartType,
      selectedChartType,
      activeQuery,
      priceEntries: priceQuery.entries,
      volumeEntries: volumeQuery.entries,
    }
  }, [chartType, selectedChartType, volumeQuery, priceQuery, timePeriod, setChartType])
}
