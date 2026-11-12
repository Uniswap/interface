import { type PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type {
  GetTokenHistoryOHLCResponse,
  GetTokenHistoryPriceResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { UniverseChainId } from '@universe/chains'
import { UTCTimestamp } from 'lightweight-charts'
import { useEffect, useMemo, useReducer, useRef } from 'react'
import { appendLiveSpotPriceEntry } from 'uniswap/src/components/charts/utils'
import { getGetTokenHistoryOHLCQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { toRestHistoryDuration } from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { isRefreshingAgedPrice } from 'uniswap/src/features/prices/isRefreshingAgedPrice'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { useIsWindowVisible } from 'utilities/src/react/useIsWindowVisible'
import { isQueryLoading } from 'utilities/src/reactQuery/isQueryLoading'
import { TimePeriod } from '~/data/util'
import { useRestHistoryTarget } from '~/hooks/useRestHistoryTarget'
import {
  ChartQueryResult,
  ChartType,
  checkDataQuality,
  DataQuality,
  getCurrentUTCTimestamp,
  PriceChartData,
  PriceChartType,
} from '~/utils/charts'
import { getTokenPriceHistoryQueryOptions } from '~/utils/tokenQueryOptions'

export type TokenPriceChartQueryVariables = {
  chainId: UniverseChainId
  address?: string
  duration: HistoryDuration
  multichain: boolean
}

export function selectOhlcChartData(data: PlainMessage<GetTokenHistoryOHLCResponse> | undefined): PriceChartData[] {
  return (data?.candles ?? []).map((candle) => ({
    time: Number(candle.timestamp) as UTCTimestamp,
    value: candle.closeUsd,
    open: candle.openUsd,
    high: candle.highUsd,
    low: candle.lowUsd,
    close: candle.closeUsd,
  }))
}

export function selectPriceChartData(data: PlainMessage<GetTokenHistoryPriceResponse> | undefined): PriceChartData[] {
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

export const CANDLESTICK_FALLBACK_THRESHOLD = 0.1

/** Backend sometimes returns invalid OHLC data on some chains: a long run of 0-valued candles. Used to trigger a fallback to price history. */
export function isZeroOhlcSeries(entries: { value: number }[]): boolean {
  if (!entries.length) {
    return true
  }
  const zeroCount = entries.filter((entry) => entry.value === 0).length
  return zeroCount / entries.length > CANDLESTICK_FALLBACK_THRESHOLD
}

/**
 * Merges an ascending series into `resolutionSeconds` candles on the absolute time grid: first open, max
 * high, min low, last close per bucket. Keyed on time rather than index, so a missing source candle
 * leaves its bucket short instead of pulling a neighbour across the boundary.
 */
export function mergeCandlesToGrid({
  candles,
  resolutionSeconds,
}: {
  candles: PriceChartData[]
  resolutionSeconds: number
}): PriceChartData[] {
  const merged: PriceChartData[] = []
  for (const candle of candles) {
    const time = (Math.floor(candle.time / resolutionSeconds) * resolutionSeconds) as UTCTimestamp
    const last = merged.at(-1)
    if (last?.time === time) {
      merged[merged.length - 1] = {
        ...last,
        high: Math.max(last.high, candle.high),
        low: Math.min(last.low, candle.low),
        close: candle.close,
        value: candle.close,
      }
    } else {
      merged.push({ ...candle, time })
    }
  }
  return merged
}

/**
 * Appends the current spot price as a new trailing bar, or patches the last bar's close if it
 * falls within the same time window — keeps the chart fresh and ending at the live price.
 * Callers must pass a strictly time-ascending series (toStrictlyAscendingByTime): a duplicate
 * trailing timestamp makes the derived granularity 0 and forces the append branch.
 */
export function appendOrPatchSpotBar({
  candles,
  spotPrice,
}: {
  candles: PriceChartData[]
  spotPrice: number | undefined
}): PriceChartData[] {
  if (!spotPrice || candles.length <= 1) {
    return candles
  }

  const lastEntry = candles[candles.length - 1]
  const secondToLastEntry = candles[candles.length - 2]
  const granularity = lastEntry.time - secondToLastEntry.time

  const now = getCurrentUTCTimestamp()
  // If the current price falls within the last entry's time window, update the last entry's close price
  if (now - lastEntry.time < granularity) {
    return [...candles.slice(0, -1), { ...lastEntry, time: now, value: spotPrice, close: spotPrice }]
  }

  // If the current price falls outside the last entry's time window, add it as a new entry
  return [
    ...candles,
    { time: now, value: spotPrice, open: spotPrice, high: spotPrice, low: spotPrice, close: spotPrice },
  ]
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
  const isVisible = useIsWindowVisible()

  // Fetch CoinGecko data for line charts to prefer its priceHistory
  // Construct currencyId from chain and address for the CoinGecko query
  const currencyIdValue = useMemo(() => {
    if (!variables.address) {
      return undefined
    }
    return buildCurrencyId(variables.chainId, variables.address)
  }, [variables.chainId, variables.address])

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
    getTokenPriceHistoryQueryOptions({
      target: restTarget,
      duration: variables.duration,
      enabled: restCommonEnabled && !useRestOhlc,
      keepPreviousData,
      select: selectPriceChartData,
    }),
  )
  const isRestOhlcAged = isRefreshingAgedPrice(restOhlcQuery)
  const isRestPriceAged = isRefreshingAgedPrice(restPriceQuery)
  const restOhlcEntries = isRestOhlcAged ? undefined : restOhlcQuery.data
  const restPriceEntries = isRestPriceAged ? undefined : restPriceQuery.data
  const restOhlcLoading = isRestOhlcAged || isQueryLoading(restOhlcQuery)
  const restPriceLoading = isRestPriceAged || isQueryLoading(restPriceQuery)
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
