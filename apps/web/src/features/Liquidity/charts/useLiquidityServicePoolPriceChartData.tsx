import { useQuery } from '@tanstack/react-query'
import type { ChainId } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { GetPoolHistoryPriceRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
import { appendLiveSpotPriceEntry } from 'uniswap/src/components/charts/utils'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import { hashKey } from 'utilities/src/reactQuery/hashKey'
import { PriceChartData } from '~/components/Charts/PriceChart'
import {
  toLiquidityHistoryDuration,
  versionFromVars,
  type PDPChartQueryVars,
} from '~/features/Liquidity/charts/liquidityServiceHistoryVars'
import { ChartQueryResult, ChartType, DataQuality, getCurrentUTCTimestamp } from '~/utils/charts'
import { removeOutliers } from '~/utils/prices'

/** Pool price entries are single-valued, not real candles: every OHLC field carries the same price. */
function buildFlatEntry(time: UTCTimestamp, value: number): PriceChartData {
  return { time, value, open: value, high: value, low: value, close: value }
}

/**
 * `usePoolPriceChartData` data source backed by the liquidity-service `GetPoolHistoryPrice`
 * endpoint. `GetPoolHistoryPrice` requires the protocol version (derived from the isV2/isV3/isV4
 * vars).
 */
export function useLiquidityServicePoolPriceChartData({
  variables,
  priceInverted,
  currentPrice,
  disabled = false,
}: {
  variables?: PDPChartQueryVars
  priceInverted: boolean
  // Live spot price already oriented to match `priceInverted` (same units as entry values).
  currentPrice?: number
  disabled?: boolean
}): ChartQueryResult<PriceChartData, ChartType.PRICE> {
  const chainId = variables?.chainId
  const version = variables ? versionFromVars(variables) : undefined

  const { data, isLoading: loading } = useQuery(
    liquidityQueries.getPoolHistoryPrice({
      params:
        variables && chainId && version
          ? new GetPoolHistoryPriceRequest({
              pool: { chainId: chainId as number as ChainId, addressOrId: variables.addressOrId, version },
              duration: toLiquidityHistoryDuration(variables.duration),
            })
          : undefined,
      enabled: !disabled && !!variables?.addressOrId && !!chainId && version !== undefined,
    }),
  )

  return useMemo(() => {
    const entries =
      data?.points.map((point) =>
        buildFlatEntry(
          Number(point.timestamp) as UTCTimestamp,
          priceInverted ? point.priceToken1InToken0 : point.priceToken0InToken1,
        ),
      ) ?? []

    // Append the live spot price so every timeframe ends at the current price, not a stale trailing candle.
    // `keepLatest` exempts that trailing entry from the outlier filter (it is the one we overwrite with the
    // live price).
    const filteredEntries = appendLiveSpotPriceEntry({
      entries: removeOutliers(entries, { keepLatest: Boolean(currentPrice) }),
      currentPrice,
      now: getCurrentUTCTimestamp(),
      getTime: (entry) => entry.time,
      createEntry: ({ time, price }) => buildFlatEntry(time, price),
      updateEntry: (_entry, { time, price }) => buildFlatEntry(time, price),
    })
    const dataQuality = loading || !data?.points.length ? DataQuality.INVALID : DataQuality.VALID
    const dataHash = hashKey(filteredEntries)

    return { chartType: ChartType.PRICE, entries: filteredEntries, loading, dataQuality, dataHash }
  }, [data?.points, loading, priceInverted, currentPrice])
}
