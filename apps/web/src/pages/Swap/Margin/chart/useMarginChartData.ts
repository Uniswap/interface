import { type PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type {
  GetTokenHistoryOHLCResponse,
  GetTokenHistoryPriceResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { GraphQLApi } from '@universe/api'
import { UTCTimestamp } from 'lightweight-charts'
import { useEffect, useMemo, useRef } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { getGetTokenHistoryOHLCQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { toRestHistoryDuration } from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { isQueryLoading } from 'utilities/src/reactQuery/isQueryLoading'
import { PriceChartData } from '~/components/Charts/PriceChart'
import { ChartType, checkDataQuality, DataQuality } from '~/components/Charts/utils'
import { MarginMarket, MarginTokenInfo } from '~/constants/margin'
import { TimePeriod } from '~/data/util'
import { useRestHistoryTarget } from '~/hooks/useRestHistoryTarget'
import {
  appendOrPatchSpotBar,
  CANDLESTICK_FALLBACK_THRESHOLD,
  combineCandlesByHalving,
  type TokenPriceChartQueryVariables,
  toStrictlyAscendingByTime,
} from '~/hooks/useTokenPriceChartData'
import { usePageVisibility } from '~/lib/hooks/usePageVisibility'
import { marginPairLegs } from '~/pages/Swap/Margin/marginTokenDisplay'
import { getTdpTokenPriceHistoryQueryOptions } from '~/pages/TokenDetails/tdpTokenQueryOptions'

export type MarginChartTimeframe = '1H' | '1D' | '1W' | '1M' | '1Y' | 'ALL'

const TIMEFRAME_TO_PERIOD: Record<MarginChartTimeframe, TimePeriod> = {
  '1H': TimePeriod.HOUR,
  '1D': TimePeriod.DAY,
  '1W': TimePeriod.WEEK,
  '1M': TimePeriod.MONTH,
  '1Y': TimePeriod.YEAR,
  ALL: TimePeriod.MAX,
}

export function timeframeToTimePeriod({ timeframe }: { timeframe: MarginChartTimeframe }): TimePeriod {
  return TIMEFRAME_TO_PERIOD[timeframe]
}

// REST (DataAPI) history duration per timeframe. Drives the OHLC/price/volume REST queries; main
// migrated the token price chart off the GraphQL useTokenPriceQuery onto these REST endpoints.
const TIMEFRAME_TO_DURATION: Record<MarginChartTimeframe, HistoryDuration> = {
  '1H': HistoryDuration.Hour,
  '1D': HistoryDuration.Day,
  '1W': HistoryDuration.Week,
  '1M': HistoryDuration.Month,
  '1Y': HistoryDuration.Year,
  ALL: HistoryDuration.Max,
}

export function timeframeToDuration({ timeframe }: { timeframe: MarginChartTimeframe }): HistoryDuration {
  return TIMEFRAME_TO_DURATION[timeframe]
}

// DataAPI OHLC candle -> chart candle. Mirrors selectOhlcChartData in useTokenPriceChartData.
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

// DataAPI price point -> flat (line-only) candle. Mirrors selectPriceChartData in useTokenPriceChartData.
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

export interface TimestampedOhlcLike {
  timestamp: number
  open: { value: number }
  high: { value: number }
  low: { value: number }
  close: { value: number }
}

export interface MarginChartData {
  candles: PriceChartData[]
  // Computed on the raw (unhalved, pre-spot-patch) series: halving ages the trailing bar's time and
  // the spot patch rewrites it to "now" — both would mask the staleness checkDataQuality detects.
  quality: DataQuality
  candlesUnavailable: boolean
  stats24h: { changePct?: number; high?: number; low?: number }
  loading: boolean
  error?: Error
  refetch: () => void
}

// The non-stable side, whose USD price the chart tracks.
export function volatileLeg({ market }: { market: MarginMarket }): MarginTokenInfo {
  return marginPairLegs(market).base
}

export function ohlcToCandles({ ohlc }: { ohlc: ReadonlyArray<TimestampedOhlcLike | null> }): PriceChartData[] {
  const mapped = ohlc
    .filter((p): p is TimestampedOhlcLike => p !== null)
    .map((p) => {
      const close = p.close.value
      return {
        time: Math.floor(p.timestamp) as UTCTimestamp,
        open: p.open.value,
        high: p.high.value,
        low: p.low.value,
        close,
        value: close,
      }
    })
  mapped.sort((a, b) => (a.time as number) - (b.time as number)) // toStrictlyAscendingByTime DROPS out-of-order — sort first
  return toStrictlyAscendingByTime(mapped)
}

export function deriveStats24h({ dayCandles }: { dayCandles: PriceChartData[] }): MarginChartData['stats24h'] {
  if (dayCandles.length === 0) {
    return { changePct: undefined, high: undefined, low: undefined }
  }
  const baseline = dayCandles[0]!.close // app convention (getCalculatedPricePercentChange uses entries[0].close)
  const last = dayCandles[dayCandles.length - 1]!
  const high = Math.max(...dayCandles.map((c) => c.high))
  const low = Math.min(...dayCandles.map((c) => c.low))
  // Mirror the changePct baseline guard: a degraded all-zero / non-finite OHLC series has no real
  // extremes — omit H/L rather than render "$0.00".
  const extremesValid = Number.isFinite(high) && Number.isFinite(low) && high > 0
  return {
    changePct: baseline > 0 ? ((last.close - baseline) / baseline) * 100 : undefined,
    high: extremesValid ? high : undefined,
    low: extremesValid ? low : undefined,
  }
}

type PriceHistoryEntry = { timestamp: number; value: number }

// CoinGecko-fallback path: flat OHLC (no real high/low), line-only rendering upstream.
export function priceHistoryToCandles({
  priceHistory,
}: {
  priceHistory: ReadonlyArray<PriceHistoryEntry | undefined>
}): PriceChartData[] {
  const mapped = priceHistory
    .filter((p): p is PriceHistoryEntry => p !== undefined)
    .map((p) => ({
      time: p.timestamp as UTCTimestamp,
      value: p.value,
      open: p.value,
      high: p.value,
      low: p.value,
      close: p.value,
    }))
  mapped.sort((a, b) => (a.time as number) - (b.time as number)) // toStrictlyAscendingByTime DROPS out-of-order — sort first
  return toStrictlyAscendingByTime(mapped)
}

export function useMarginChartData({
  market,
  timeframe,
}: {
  market: MarginMarket
  timeframe: MarginChartTimeframe
}): MarginChartData {
  const isVisible = usePageVisibility()
  const { address } = volatileLeg({ market })
  const duration = TIMEFRAME_TO_DURATION[timeframe]
  const refetchInterval = isVisible ? PollingInterval.KindaFast : undefined

  const variables: TokenPriceChartQueryVariables = {
    chain: GraphQLApi.Chain.Ethereum,
    address,
    duration,
    multichain: false,
  }
  const restTarget = useRestHistoryTarget(variables)
  const commonEnabled = !!restTarget

  // Hook A: OHLC for the current timeframe. ALWAYS attempted — never sticky, so switching
  // timeframes always re-tries candles (unlike the Token-page hook's one-way fallback latch).
  const mainQuery = useQuery({
    ...getGetTokenHistoryOHLCQueryOptions({
      params: { target: restTarget, duration: toRestHistoryDuration(duration) },
      enabled: commonEnabled,
      keepPreviousData: true,
      select: selectOhlcChartData,
    }),
    refetchInterval,
  })
  const mainOhlcMapped = useMemo(
    () =>
      toStrictlyAscendingByTime([...(mainQuery.data ?? [])].sort((a, b) => (a.time as number) - (b.time as number))),
    [mainQuery.data],
  )

  // Fallback trigger, on the raw (pre-halving) series. Gated on Hook A having settled so an
  // in-flight fetch (no data yet) is never misread as "bad candles".
  const mainLoading = isQueryLoading(mainQuery)
  const mainSettled = !mainLoading && mainQuery.data !== undefined
  const zeroCount = mainOhlcMapped.filter((c) => c.close === 0).length
  const needsFallback =
    mainSettled && (mainOhlcMapped.length === 0 || zeroCount / mainOhlcMapped.length > CANDLESTICK_FALLBACK_THRESHOLD)

  // Hook C (fallback): only fires once Hook A's OHLC looks bad; price history renders line-only.
  const fallbackQuery = useQuery(
    getTdpTokenPriceHistoryQueryOptions({
      target: restTarget,
      duration,
      enabled: commonEnabled && needsFallback,
      keepPreviousData: true,
      select: selectPriceChartData,
    }),
  )
  const fallbackLoading = isQueryLoading(fallbackQuery)
  const fallbackCandles = useMemo(
    () =>
      toStrictlyAscendingByTime(
        [...(fallbackQuery.data ?? [])].sort((a, b) => (a.time as number) - (b.time as number)),
      ),
    [fallbackQuery.data],
  )

  // Hook B: pinned-DAY OHLC for 24h stats. Skipped on 1D (Hook A already covers the day). Polls at
  // Hook A's cadence so the 24h stats stay live on 1W/1M/1Y/ALL.
  const dayQuery = useQuery({
    ...getGetTokenHistoryOHLCQueryOptions({
      params: { target: restTarget, duration: toRestHistoryDuration(HistoryDuration.Day) },
      enabled: commonEnabled && timeframe !== '1D',
      keepPreviousData: true,
      select: selectOhlcChartData,
    }),
    refetchInterval,
  })
  const dayCandlesRaw = useMemo(
    () => toStrictlyAscendingByTime([...(dayQuery.data ?? [])].sort((a, b) => (a.time as number) - (b.time as number))),
    [dayQuery.data],
  )

  // Spot price for the volatile leg (replaces the GraphQL market.price.value), patched onto the
  // trailing bar to keep the chart ending at the live price.
  const chainId = fromGraphQLChain(GraphQLApi.Chain.Ethereum)
  const currencyId = chainId && address ? buildCurrencyId(chainId, address) : undefined
  const spotPrice = useTokenSpotPrice(currencyId, { skip: !currencyId, refetchInterval })

  const refetch = useEvent(() => {
    mainQuery.refetch().catch(() => {})
    if (needsFallback) {
      fallbackQuery.refetch().catch(() => {})
    }
    if (timeframe !== '1D') {
      dayQuery.refetch().catch(() => {})
    }
  })

  const prevVisibleRef = useRef(isVisible)
  useEffect(() => {
    if (isVisible && !prevVisibleRef.current) {
      refetch()
    }
    prevVisibleRef.current = isVisible
  }, [isVisible, refetch])

  const mainError = mainQuery.error ?? undefined
  const fallbackError = fallbackQuery.error ?? undefined

  return useMemo(() => {
    // Quality runs on the raw (unhalved, unpatched) series; the halved+patched series only renders.
    const rawCandles = needsFallback ? fallbackCandles : mainOhlcMapped
    const quality = checkDataQuality({ data: rawCandles, chartType: ChartType.PRICE, duration })

    const candlesPrePatch = needsFallback ? rawCandles : combineCandlesByHalving({ candles: mainOhlcMapped })
    const candles = appendOrPatchSpotBar({ candles: candlesPrePatch, spotPrice })

    // Self-consistency with the on-screen chart beats matching a server-computed 24h change: reuse
    // the same series already backing the chart on 1D; otherwise the dedicated DAY series.
    const dayCandles = timeframe === '1D' ? candles : dayCandlesRaw
    const stats24h = deriveStats24h({ dayCandles })

    return {
      candles,
      quality,
      candlesUnavailable: needsFallback,
      stats24h,
      loading: mainLoading || (needsFallback && fallbackLoading),
      error: mainError ?? (needsFallback ? fallbackError : undefined),
      refetch,
    }
  }, [
    needsFallback,
    fallbackCandles,
    mainOhlcMapped,
    dayCandlesRaw,
    spotPrice,
    duration,
    timeframe,
    mainLoading,
    fallbackLoading,
    mainError,
    fallbackError,
    refetch,
  ])
}
