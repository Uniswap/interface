import { type PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type {
  GetTokenHistoryOHLCResponse,
  GetTokenHistoryPriceResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { UTCTimestamp } from 'lightweight-charts'
import { useEffect, useMemo, useReducer, useRef } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import {
  getGetTokenHistoryOHLCQueryOptions,
  getGetTokenHistoryPriceQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { toRestHistoryDuration } from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { TimePeriod } from '~/appGraphql/data/util'
import { PriceChartData } from '~/components/Charts/PriceChart'
import {
  appendCurrentValue,
  ChartQueryResult,
  ChartType,
  checkDataQuality,
  DataQuality,
  isZeroOhlcSeries,
  PriceChartType,
} from '~/components/Charts/utils'
import { useRestHistoryTarget } from '~/hooks/useRestHistoryTarget'
import { usePageVisibility } from '~/lib/hooks/usePageVisibility'

export type TokenPriceChartQueryVariables = {
  chain: GraphQLApi.Chain
  address?: string
  duration: GraphQLApi.HistoryDuration
  multichain: boolean
}

type PriceHistoryEntry = Pick<GraphQLApi.PriceHistoryFallbackFragment, 'timestamp' | 'value'>

function fallbackToPriceChartData(priceHistoryEntry: PriceHistoryEntry): PriceChartData {
  const { value, timestamp } = priceHistoryEntry
  const time = timestamp as UTCTimestamp
  return { time, value, open: value, high: value, low: value, close: value }
}

function toPriceChartData(ohlc: GraphQLApi.CandlestickOhlcFragment): PriceChartData {
  const { open, high, low, close } = ohlc
  const time = ohlc.timestamp as UTCTimestamp
  return { time, value: close.value, open: open.value, high: high.value, low: low.value, close: close.value }
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
  preferProjectMarketData = false,
}: {
  variables: TokenPriceChartQueryVariables
  skip: boolean
  priceChartType: PriceChartType
  currentPriceOverride?: number
  preferProjectMarketData?: boolean
}): ChartQueryResult<PriceChartData, ChartType.PRICE> & { disableCandlestickUI: boolean } {
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)
  // RWA/project-market data has no REST equivalent yet, so those tokens keep using GraphQL even when V2 is on.
  const shouldUseV2Tokens = isV2TokensEnabled && !preferProjectMarketData
  const [fallback, enablePriceHistoryFallback] = useReducer(() => true, false)
  // Project markets do not provide OHLC, so RWA charts always render as line charts even if stale UI state says candle.
  const effectivePriceChartType = preferProjectMarketData ? PriceChartType.LINE : priceChartType

  const isVisible = usePageVisibility()

  // For candlestick charts, use subgraph OHLC data (required, not available in CoinGecko)
  // For line charts when fallback is needed, fetch both CoinGecko and subgraph data
  const {
    data: subgraphData,
    loading: subgraphLoading,
    refetch: refetchSubgraph,
  } = GraphQLApi.useTokenPriceQuery({
    variables: { ...variables, fallback },
    skip: skip || shouldUseV2Tokens,
    pollInterval: isVisible ? PollingInterval.KindaFast : 0,
  })

  // Fetch CoinGecko data for line charts to prefer its priceHistory
  // Construct currencyId from chain and address for the CoinGecko query
  const currencyIdValue = useMemo(() => {
    if (!variables.address) {
      return undefined
    }
    const chainId = fromGraphQLChain(variables.chain)
    return chainId ? buildCurrencyId(chainId, variables.address) : undefined
  }, [variables.chain, variables.address])

  const shouldFetchCoinGeckoHistory =
    effectivePriceChartType === PriceChartType.LINE && (!variables.multichain || preferProjectMarketData)

  const { data: coinGeckoData, loading: coinGeckoLoading } = GraphQLApi.useTokenPriceHistoryQuery({
    variables: {
      contract: currencyIdValue
        ? currencyIdToContractInput(currencyIdValue)
        : { address: undefined, chain: variables.chain },
      duration: variables.duration,
    },
    skip: skip || !currencyIdValue || !shouldFetchCoinGeckoHistory || shouldUseV2Tokens,
    // IMPORTANT: Must use no-cache to prevent infinite query loop.
    //
    // TokenPriceHistory returns Token objects (with chain/address) nested inside tokenProjects.
    // Apollo normalizes these into the shared Token[chain, address] cache (defined in packages/uniswap/src/data/cache.ts).
    // This triggers watchers on TokenWeb and TokenPrice queries (which use the same cache keys),
    // causing them to re-emit, which triggers re-renders, which re-executes this query → infinite loop.
    fetchPolicy: 'no-cache',
  })

  const prevVisibleRef = useRef(isVisible)
  useEffect(() => {
    if (isVisible && !prevVisibleRef.current && !skip && !shouldUseV2Tokens) {
      refetchSubgraph().catch(() => {})
    }
    prevVisibleRef.current = isVisible
  }, [isVisible, skip, shouldUseV2Tokens, refetchSubgraph])

  const loading = subgraphLoading || (shouldFetchCoinGeckoHistory && coinGeckoLoading)

  // REST path: OHLC feeds candlestick charts, Price feeds line charts.
  const restTarget = useRestHistoryTarget(variables)
  const useRestOhlc = effectivePriceChartType === PriceChartType.CANDLESTICK && !fallback
  const restCommonEnabled = shouldUseV2Tokens && !skip && !!restTarget
  const { data: restOhlcEntries, isLoading: restOhlcLoading } = useQuery(
    getGetTokenHistoryOHLCQueryOptions({
      params: { target: restTarget, duration: toRestHistoryDuration(variables.duration) },
      enabled: restCommonEnabled && useRestOhlc,
      select: selectOhlcChartData,
    }),
  )
  const { data: restPriceEntries, isLoading: restPriceLoading } = useQuery(
    getGetTokenHistoryPriceQueryOptions({
      params: { target: restTarget, duration: toRestHistoryDuration(variables.duration) },
      enabled: restCommonEnabled && !useRestOhlc,
      select: selectPriceChartData,
    }),
  )

  // oxlint-disable-next-line complexity
  return useMemo(() => {
    if (shouldUseV2Tokens) {
      let restEntries = useRestOhlc ? (restOhlcEntries ?? []) : (restPriceEntries ?? [])
      const restLoading = useRestOhlc ? restOhlcLoading : restPriceLoading

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
      restEntries = appendCurrentValue({
        entries: restEntries,
        currentValue: currentPriceOverride,
        buildEntry: (time, value) => ({ time, value, open: value, high: value, low: value, close: value }),
        withCurrentValue: (entry, { time, value }) => ({ ...entry, time, value, close: value }),
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
        disableCandlestickUI: fallback,
      }
    }

    const subgraphMarket = subgraphData?.token?.market
    const { ohlc, priceHistory: subgraphPriceHistory, price: subgraphPrice } = subgraphMarket ?? {}

    // CoinGecko exposes both project-level market data and per-contract token market data.
    // Default token pages prefer per-contract CoinGecko history so multichain tokens stay chain-specific.
    // RWA pages use project-level history because the useful chart is the underlying security, not wrapper liquidity.
    const coinGeckoProject = coinGeckoData?.tokenProjects?.[0]
    const coinGeckoMarket = coinGeckoProject?.markets?.[0]
    const coinGeckoTokenMarket = coinGeckoProject?.tokens.find((token) => token.chain === variables.chain)?.market
    let coinGeckoPriceHistory: (PriceHistoryEntry | undefined)[] | undefined =
      coinGeckoTokenMarket?.priceHistory ?? coinGeckoMarket?.priceHistory
    let coinGeckoCurrentPrice = coinGeckoTokenMarket?.price?.value ?? coinGeckoMarket?.price?.value
    if (preferProjectMarketData) {
      coinGeckoPriceHistory = coinGeckoMarket?.priceHistory
      coinGeckoCurrentPrice = coinGeckoMarket?.price?.value
    }

    // Candlestick charts always use subgraph OHLC. Line charts use CoinGecko history when available.
    const isWaitingForProjectMarketHistory =
      preferProjectMarketData && effectivePriceChartType === PriceChartType.LINE && coinGeckoLoading
    const shouldUseCoinGeckoHistory =
      effectivePriceChartType === PriceChartType.LINE &&
      Boolean(coinGeckoPriceHistory?.length) &&
      (!variables.multichain || preferProjectMarketData)

    let priceHistory: (PriceHistoryEntry | undefined)[] | undefined = subgraphPriceHistory
    let ohlcPriceHistory = ohlc
    if (isWaitingForProjectMarketHistory) {
      priceHistory = undefined
      ohlcPriceHistory = undefined
    } else if (shouldUseCoinGeckoHistory) {
      priceHistory = coinGeckoPriceHistory
      ohlcPriceHistory = undefined
    }

    // CRITICAL: By default, multi-chain tokens use per-chain subgraph price.
    // This ensures USDC on Ethereum shows Ethereum price, not aggregated price.
    // Tokenized securities opt into project-level price because the underlying security is the useful quote.
    // When centralized prices are enabled, the override provides live WebSocket prices
    let resolvedMarketPrice = subgraphPrice?.value ?? coinGeckoCurrentPrice
    if (preferProjectMarketData) {
      resolvedMarketPrice = coinGeckoCurrentPrice ?? subgraphPrice?.value
    }
    const currentPrice = currentPriceOverride ?? resolvedMarketPrice

    let entries =
      (ohlcPriceHistory
        ? ohlcPriceHistory.filter((v): v is GraphQLApi.CandlestickOhlcFragment => v !== undefined).map(toPriceChartData)
        : priceHistory?.filter((v): v is PriceHistoryEntry => v !== undefined).map(fallbackToPriceChartData)) ?? []

    if (ohlcPriceHistory) {
      if (isZeroOhlcSeries(entries)) {
        enablePriceHistoryFallback() // triggers a re-fetch that uses priceHistory instead of OHLC
        return {
          chartType: ChartType.PRICE,
          entries: [],
          loading: true,
          disableCandlestickUI: true,
          dataQuality: DataQuality.INVALID,
        }
      }

      // For line charts made using ohlc data, the min and max entries should point to their low/high, rather than close,
      // to ensure the chart line makes contact with the min/max lines.
      if (effectivePriceChartType === PriceChartType.LINE) {
        let min = entries[0].low
        let minIndex = 0
        let max = entries[0].high
        let maxIndex = 0

        entries.forEach((entry, index) => {
          if (entry.low < min) {
            min = entry.low
            minIndex = index
          }
          if (entry.high > max) {
            max = entry.high
            maxIndex = index
          }
        })
        // Avoid modifying the last entry, as it should point to the current price
        if (minIndex !== entries.length - 1) {
          entries[minIndex].value = min
        }
        if (maxIndex !== entries.length - 1) {
          entries[maxIndex].value = max
        }
      }
      // Special case: backend data for OHLC data is currently too granular, so points should be combined, halving the data
      // oxlint-disable-next-line typescript/no-unnecessary-condition
      else if (effectivePriceChartType === PriceChartType.CANDLESTICK) {
        const combinedEntries = []

        const startIndex = entries.length % 2 // If the length is odd, start at the second entry
        for (let i = startIndex; i < entries.length; i += 2) {
          const first = entries[i]
          const second = entries[i + 1]
          const combined = {
            time: first.time,
            open: first.open,
            high: Math.max(first.high, second.high),
            low: Math.min(first.low, second.low),
            close: second.close,
            value: second.close,
          }
          combinedEntries.push(combined)
        }
        entries = combinedEntries
      }
    }

    // Sanitize timestamps before appending: drop duplicate/out-of-order points so the chart's
    // curved interpolation doesn't break, and so the granularity calc below isn't poisoned by a
    // zero delta between two identical trailing timestamps.
    entries = toStrictlyAscendingByTime(entries)

    // Append current price to end of array to ensure data freshness and that each time period ends with same price
    entries = appendCurrentValue({
      entries,
      currentValue: currentPrice,
      buildEntry: (time, value) => ({ time, value, open: value, high: value, low: value, close: value }),
      withCurrentValue: (entry, { time, value }) => ({ ...entry, time, value, close: value }),
    })

    const dataQuality = checkDataQuality({ data: entries, chartType: ChartType.PRICE, duration: variables.duration })
    return {
      chartType: ChartType.PRICE,
      entries,
      loading,
      dataQuality,
      disableCandlestickUI: preferProjectMarketData || fallback,
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- coinGeckoData.tokenProjects is intentionally accessed via optional chaining
  }, [
    shouldUseV2Tokens,
    restOhlcEntries,
    restOhlcLoading,
    restPriceEntries,
    restPriceLoading,
    useRestOhlc,
    currentPriceOverride,
    subgraphData?.token?.market,
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
    coinGeckoData?.tokenProjects?.[0],
    coinGeckoLoading,
    effectivePriceChartType,
    fallback,
    loading,
    preferProjectMarketData,
    variables.duration,
    variables.chain,
    variables.multichain,
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
