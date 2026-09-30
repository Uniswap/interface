import { type PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type {
  GetTokenHistoryOHLCResponse,
  GetTokenHistoryPriceResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { GraphQLApi } from '@universe/api'
import { UTCTimestamp } from 'lightweight-charts'
import { useEffect, useMemo, useReducer, useRef } from 'react'
import { appendLiveSpotPriceEntry } from 'uniswap/src/components/charts/utils'
import { getGetTokenHistoryOHLCQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { toRestHistoryDuration } from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { isQueryLoading } from 'utilities/src/reactQuery/isQueryLoading'
import { PriceChartData } from '~/components/Charts/PriceChart'
import {
  ChartQueryResult,
  ChartType,
  checkDataQuality,
  DataQuality,
  getCurrentUTCTimestamp,
  isZeroOhlcSeries,
  PriceChartType,
} from '~/components/Charts/utils'
import { TimePeriod } from '~/data/util'
import { useRestHistoryTarget } from '~/hooks/useRestHistoryTarget'
import { usePageVisibility } from '~/lib/hooks/usePageVisibility'
import { getTdpTokenPriceHistoryQueryOptions } from '~/pages/TokenDetails/tdpTokenQueryOptions'

export type TokenPriceChartQueryVariables = {
  chain: GraphQLApi.Chain
  address?: string
  duration: HistoryDuration
  multichain: boolean
}

function selectOhlcChartData(data: PlainMessage<GetTokenHistoryOHLCResponse> | undefined): PriceChartData[] {
  return (data?.candles ?? []).map((candle) => ({
    time: Number(candle.timestamp) as UTCTimestamp,
    value: candle.closeUsd,
    open: candle.openUsd,
    high: candle.highUsd,
    low: candle.lowUsd,
    close: candle.closeUsd,
  }))
}

function selectPriceChartData(data: PlainMessage<GetTokenHistoryPriceResponse> | undefined): PriceChartData[] {
  return (data?.points ?? []).map((point) => ({
    time: Number(point.timestamp) as UTCTimestamp,
    value: point.priceUsd,
    open: point.priceUsd,
    high: point.priceUsd,
    low: point.priceUsd,
    close: point.priceUsd,
  }))
}

/**
 * Enforces the strictly-ascending timestamps lightweight-charts requires. Upstream price history
 * (e.g. CoinGecko) occasionally returns a duplicate trailing timestamp; a zero time delta breaks
 * the curved line/area interpolation and paints a spurious diagonal line and filled wedge across
 * the chart. Duplicates collapse to the latest value; any out-of-order point is dropped.
 */
export function toStrictlyAscendingByTime(entries: PriceChartData[]): PriceChartData[] {
  const result: PriceChartData[] = []
  let lastTime: number | undefined
  for (const entry of entries) {
    if (lastTime === undefined || entry.time > lastTime) {
      result.push(entry)
      lastTime = entry.time
    } else if (entry.time === lastTime) {
      result[result.length - 1] = entry
    }
    // entry.time < lastTime (out of order) -> drop
  }
  return result
}

export function useTokenPriceChartData({
  variables,
  skip,
  priceChartType,
  currentPriceOverride,
  disablePricePolling = false,
  keepPreviousData = true,
}: {
  variables: TokenPriceChartQueryVariables
  skip: boolean
  priceChartType: PriceChartType
  currentPriceOverride?: number
  /** Disables the legacy subgraph query's own 30s poll — pass true where a page heartbeat owns the price cadence (see useTokenPriceChartPanel). */
  disablePricePolling?: boolean
  /** Set false to show a loading skeleton when the selected period changes. */
  keepPreviousData?: boolean
}): ChartQueryResult<PriceChartData, ChartType.PRICE> & { disableCandlestickUI: boolean } {
  const [fallback, enablePriceHistoryFallback] = useReducer(() => true, false)
  const isVisible = usePageVisibility()

  // Fetch CoinGecko data for line charts to prefer its priceHistory
  // Construct currencyId from chain and address for the CoinGecko query
  const currencyIdValue = useMemo(() => {
    if (!variables.address) {
      return undefined
    }
    const chainId = fromGraphQLChain(variables.chain)
    return chainId ? buildCurrencyId(chainId, variables.address) : undefined
  }, [variables.chain, variables.address])

  // The V2 branch skips the subgraph/CoinGecko queries, so unlike legacy it has no market price to
  // fall back to when the caller supplies no override (e.g. TokenHoverCard) — without one the live
  // trailing point is never appended. React Query dedupes this with useTokenPriceChartPanel's
  // polled spot-price query on surfaces that do pass the override.
  const v2SpotPriceFallback = useTokenSpotPrice(currencyIdValue, {
    isMultichainAggregateView: variables.multichain,
    skip: skip || currentPriceOverride !== undefined,
  })

  const prevVisibleRef = useRef(isVisible)
  useEffect(() => {
    prevVisibleRef.current = isVisible
  }, [isVisible, skip, disablePricePolling])

  // REST path: OHLC feeds candlestick charts, Price feeds line charts.
  const restTarget = useRestHistoryTarget(variables)
  const useRestOhlc = priceChartType === PriceChartType.CANDLESTICK && !fallback
  const restCommonEnabled = !skip && !!restTarget
  const restOhlcQuery = useQuery(
    getGetTokenHistoryOHLCQueryOptions({
      params: { target: restTarget, duration: toRestHistoryDuration(variables.duration) },
      enabled: restCommonEnabled && useRestOhlc,
      keepPreviousData,
      select: selectOhlcChartData,
    }),
  )
  const restPriceQuery = useQuery(
    getTdpTokenPriceHistoryQueryOptions({
      target: restTarget,
      duration: variables.duration,
      enabled: restCommonEnabled && !useRestOhlc,
      keepPreviousData,
      select: selectPriceChartData,
    }),
  )
  const restOhlcEntries = restOhlcQuery.data
  const restPriceEntries = restPriceQuery.data
  const restOhlcLoading = isQueryLoading(restOhlcQuery)
  const restPriceLoading = isQueryLoading(restPriceQuery)
  const restOhlcError = restOhlcQuery.isError
  const restPriceError = restPriceQuery.isError

  return useMemo(() => {
    let restEntries = useRestOhlc ? (restOhlcEntries ?? []) : (restPriceEntries ?? [])
    const restLoading = useRestOhlc ? restOhlcLoading : restPriceLoading
    const restIsError = useRestOhlc ? restOhlcError : restPriceError

    if (useRestOhlc && restOhlcEntries && isZeroOhlcSeries(restEntries)) {
      enablePriceHistoryFallback() // triggers a re-fetch that uses GetTokenHistoryPrice instead of GetTokenHistoryOHLC
      return {
        chartType: ChartType.PRICE,
        entries: [],
        loading: true,
        disableCandlestickUI: true,
        dataQuality: DataQuality.INVALID,
      }
    }

    restEntries = toStrictlyAscendingByTime(restEntries)

    // Append current price to end of array to ensure data freshness and that each time period ends with same price
    restEntries = appendLiveSpotPriceEntry({
      entries: restEntries,
      currentPrice: currentPriceOverride ?? v2SpotPriceFallback,
      now: getCurrentUTCTimestamp(),
      getTime: (entry) => entry.time,
      createEntry: ({ time, price }) => ({ time, value: price, open: price, high: price, low: price, close: price }),
      updateEntry: (entry, { time, price }) => ({ ...entry, time, value: price, close: price }),
    })

    const restDataQuality = checkDataQuality({
      data: restEntries,
      chartType: ChartType.PRICE,
      duration: variables.duration,
    })
    return {
      chartType: ChartType.PRICE,
      entries: restEntries,
      loading: restLoading,
      dataQuality: restDataQuality,
      isError: restIsError,
      disableCandlestickUI: fallback,
    }
  }, [
    restOhlcEntries,
    restOhlcLoading,
    restOhlcError,
    restPriceEntries,
    restPriceLoading,
    restPriceError,
    useRestOhlc,
    currentPriceOverride,
    v2SpotPriceFallback,
    fallback,
    variables.duration,
  ])
}

export function getCalculatedPricePercentChange(entries: PriceChartData[]): number | undefined {
  if (!entries.length) {
    return undefined
  }
  const openPrice = entries[0].close
  const closePrice = entries[entries.length - 1].close
  if (!openPrice || !closePrice || openPrice === 0) {
    return undefined
  }
  return ((closePrice - openPrice) / openPrice) * 100
}

export function getDisplayedPricePercentChange({
  timePeriod,
  priceChange24h,
  entries,
}: {
  timePeriod: TimePeriod
  priceChange24h: number | undefined
  entries: PriceChartData[]
}): number | undefined {
  const calculated = getCalculatedPricePercentChange(entries)
  return timePeriod === TimePeriod.DAY ? priceChange24h : calculated
}
