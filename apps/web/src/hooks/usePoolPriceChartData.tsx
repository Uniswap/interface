import { GraphQLApi } from '@universe/api'
import { PriceChartData } from 'components/Charts/PriceChart'
import { ChartType } from 'components/Charts/utils'
import { ChartQueryResult, DataQuality } from 'components/Tokens/TokenDetails/ChartSection/util'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
import { hashKey } from 'utilities/src/reactQuery/hashKey'
import { removeOutliers } from 'utils/prices'

export type PDPChartQueryVars = {
  addressOrId?: string
  chain: GraphQLApi.Chain
  duration: GraphQLApi.HistoryDuration
  isV2: boolean
  isV3: boolean
  isV4: boolean
}

type PDPChartQueryVarsWithAddressOrId = PDPChartQueryVars & { addressOrId: string }

export function usePoolPriceChartData({
  variables,
  priceInverted,
}: {
  variables?: PDPChartQueryVars
  priceInverted: boolean
}): ChartQueryResult<PriceChartData, ChartType.PRICE> {
  const { data, loading } = GraphQLApi.usePoolPriceHistoryQuery({
    variables: variables as PDPChartQueryVarsWithAddressOrId,
    skip: !variables?.addressOrId,
  })
  return useMemo(() => {
    const { priceHistory } = data?.v2Pair ?? data?.v3Pool ?? data?.v4Pool ?? {}

    const entries =
      priceHistory
        ?.filter((price): price is GraphQLApi.TimestampedPoolPrice => price !== undefined)
        .map((price) => {
          const value = priceInverted ? price.token0Price : price.token1Price

          return {
            time: price.timestamp as UTCTimestamp,
            value,
            open: value,
            high: value,
            low: value,
            close: value,
          }
        }) ?? []

    const filteredEntries = removeOutliers(entries)

    // TODO(WEB-3769): Append current price based on active tick to entries
    /* const dataQuality = checkDataQuality(entries, ChartType.PRICE, variables.duration) */
    const dataQuality = loading || !priceHistory || !priceHistory.length ? DataQuality.INVALID : DataQuality.VALID

    // Hash the data to prevent priceData changes causing re-renders
    const dataHash = hashKey(filteredEntries)

    return { chartType: ChartType.PRICE, entries: filteredEntries, loading, dataQuality, dataHash }
  }, [data?.v2Pair, data?.v3Pool, data?.v4Pool, loading, priceInverted])
}
