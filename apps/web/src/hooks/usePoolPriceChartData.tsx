import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { PriceChartData } from 'components/Charts/PriceChart'
import { ChartType } from 'components/Charts/utils'
import { ChartQueryResult, DataQuality } from 'components/Tokens/TokenDetails/ChartSection/util'
import { UTCTimestamp } from 'lightweight-charts'
import { OptionalCurrency } from 'pages/Pool/Positions/create/types'
import { getCurrencyAddressWithWrap } from 'pages/Pool/Positions/create/utils'
import { useMemo } from 'react'
import {
  Chain,
  HistoryDuration,
  TimestampedPoolPrice,
  usePoolPriceHistoryQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { isSameAddress } from 'utilities/src/addresses'

export type PDPChartQueryVars = {
  addressOrId: string
  chain: Chain
  duration: HistoryDuration
  isV2: boolean
  isV3: boolean
  isV4: boolean
}

export function usePoolPriceChartData(
  variables: PDPChartQueryVars | undefined,
  currencyA: OptionalCurrency,
  currencyB: OptionalCurrency,
  protocolVersion: ProtocolVersion,
  sortedCurrencyAAddress: string,
): ChartQueryResult<PriceChartData, ChartType.PRICE> {
  const { data, loading } = usePoolPriceHistoryQuery({ variables, skip: !variables?.addressOrId })
  return useMemo(() => {
    const { priceHistory } = data?.v2Pair ?? data?.v3Pool ?? data?.v4Pool ?? {}

    const entries =
      priceHistory
        ?.filter((price): price is TimestampedPoolPrice => price !== null)
        .map((price) => {
          const value = isSameAddress(sortedCurrencyAAddress, getCurrencyAddressWithWrap(currencyA, protocolVersion))
            ? price?.token0Price
            : price?.token1Price

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
    const dataQuality = loading || !priceHistory || !priceHistory.length ? DataQuality.INVALID : DataQuality.VALID

    return { chartType: ChartType.PRICE, entries, loading, dataQuality }
  }, [data?.v2Pair, data?.v3Pool, data?.v4Pool, loading, sortedCurrencyAAddress, currencyA, protocolVersion])
}
