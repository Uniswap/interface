import { useQuery } from '@tanstack/react-query'
import { UniverseChainId } from '@universe/chains'
import { UTCTimestamp } from 'lightweight-charts'
import { useEffect, useMemo, useRef } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { getGetTokenHistoryOHLCQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import {
  type HistoryTarget,
  toRestHistoryDuration,
} from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { useIsWindowVisible } from 'utilities/src/react/useIsWindowVisible'
import { isQueryLoading } from 'utilities/src/reactQuery/isQueryLoading'
import { PriceChartData } from '~/components/Charts/PriceChart'
import { MarginMarket, MarginTokenInfo } from '~/constants/margin'
import { marginPairLegs } from '~/features/margin/utils/marginTokenDisplay'
import { useRestHistoryTarget } from '~/hooks/useRestHistoryTarget'
import {
  appendOrPatchSpotBar,
  CANDLESTICK_FALLBACK_THRESHOLD,
  mergeCandlesToGrid,
  selectOhlcChartData,
  selectPriceChartData,
  type TokenPriceChartQueryVariables,
  toStrictlyAscendingByTime,
} from '~/hooks/useTokenPriceChartData'
import {
  getMarginHistoryQueryOptions,
  MARGIN_TIME_WINDOWS,
  type MarginTimeWindow,
} from '~/pages/Swap/Margin/chart/marginTimeWindows'
import { ChartType, checkDataQuality, DataQuality } from '~/utils/charts'
import { getTokenPriceHistoryQueryOptions } from '~/utils/tokenQueryOptions'

export interface TimestampedOhlcLike {
  timestamp: number
  open: { value: number }
  high: { value: number }
  low: { value: number }
  close: { value: number }
}

export interface MarginChartData {
  candles: PriceChartData[]
  // Computed on the raw (pre-spot-patch) series: the spot patch rewrites the trailing bar's time to
  // "now", which would mask the staleness checkDataQuality detects.
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

// Sorted first: toStrictlyAscendingByTime drops an out-of-order bar rather than reordering it.
function sortedAscendingCandles(candles: readonly PriceChartData[]): PriceChartData[] {
  return toStrictlyAscendingByTime([...candles].sort((a, b) => (a.time as number) - (b.time as number)))
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
  return sortedAscendingCandles(mapped)
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
  return sortedAscendingCandles(mapped)
}

/**
 * The pinned-DAY OHLC series behind the chart header's 24h stats, ascending.
 */
function useMarginDayCandles({
  target,
  enabled,
  refetchInterval,
}: {
  target: HistoryTarget | undefined
  enabled: boolean
  refetchInterval: number | undefined
}): { candles: PriceChartData[]; refetch: () => Promise<unknown> } {
  const dayQuery = useQuery({
    ...getGetTokenHistoryOHLCQueryOptions({
      params: { target, duration: toRestHistoryDuration(HistoryDuration.Day) },
      enabled: enabled && !!target,
      keepPreviousData: true,
      select: selectOhlcChartData,
    }),
    refetchInterval,
  })
  const candles = useMemo(() => sortedAscendingCandles(dayQuery.data ?? []), [dayQuery.data])
  return { candles, refetch: dayQuery.refetch }
}

/**
 * The chart header's 24h stats and mark without the chart's candle series: only the pinned-DAY OHLC
 * series (useMarginDayCandles, as the chart's own 24h stats) and the spot price the chart patches onto
 * its last bar. For surfaces that show the stats with no chart mounted.
 */
export function useMarginStats24h({ market }: { market: MarginMarket }): {
  stats24h: MarginChartData['stats24h']
  markPrice?: number
} {
  const isVisible = useIsWindowVisible()
  const { address } = volatileLeg({ market })
  const refetchInterval = isVisible ? PollingInterval.KindaFast : undefined
  const restTarget = useRestHistoryTarget({
    chainId: UniverseChainId.Mainnet,
    address,
    duration: HistoryDuration.Day,
    multichain: false,
  })
  const { candles: dayCandles } = useMarginDayCandles({ target: restTarget, enabled: true, refetchInterval })
  const currencyId = address ? buildCurrencyId(UniverseChainId.Mainnet, address) : undefined
  const spotPrice = useTokenSpotPrice(currencyId, { skip: !currencyId, refetchInterval })
  return useMemo(
    () => ({ stats24h: deriveStats24h({ dayCandles }), markPrice: spotPrice ?? dayCandles.at(-1)?.close }),
    [dayCandles, spotPrice],
  )
}

export function useMarginChartData({
  market,
  timeWindow,
}: {
  market: MarginMarket
  timeWindow: MarginTimeWindow
}): MarginChartData {
  const { duration, candleSeconds } = MARGIN_TIME_WINDOWS[timeWindow]
  const isVisible = useIsWindowVisible()
  const { address } = volatileLeg({ market })
  const refetchInterval = isVisible ? PollingInterval.KindaFast : undefined

  const variables: TokenPriceChartQueryVariables = {
    chainId: UniverseChainId.Mainnet,
    address,
    duration,
    multichain: false,
  }
  const restTarget = useRestHistoryTarget(variables)
  const commonEnabled = !!restTarget

  // Hook A: OHLC for the selected window. ALWAYS attempted — never sticky, so switching
  // windows always re-tries candles (unlike the Token-page hook's one-way fallback latch).
  const mainQuery = useQuery(
    getMarginHistoryQueryOptions({
      name: 'getTokenHistoryOHLC',
      fetch: (params) => dataApiServiceClientV2.getTokenHistoryOHLC(params),
      target: restTarget,
      timeWindow,
      nowSeconds: Date.now() / 1000,
      enabled: commonEnabled,
      select: selectOhlcChartData,
    }),
  )
  const mainOhlcMapped = useMemo(
    () =>
      mergeCandlesToGrid({ candles: sortedAscendingCandles(mainQuery.data ?? []), resolutionSeconds: candleSeconds }),
    [mainQuery.data, candleSeconds],
  )

  // Fallback trigger, on the raw series. Gated on Hook A having settled so an
  // in-flight fetch (no data yet) is never misread as "bad candles".
  const mainLoading = isQueryLoading(mainQuery)
  const mainSettled = !mainLoading && mainQuery.data !== undefined
  const zeroCount = mainOhlcMapped.filter((c) => c.close === 0).length
  const needsFallback =
    mainSettled && (mainOhlcMapped.length === 0 || zeroCount / mainOhlcMapped.length > CANDLESTICK_FALLBACK_THRESHOLD)

  // Hook C (fallback): only fires once Hook A's OHLC looks bad; price history renders line-only.
  const fallbackQuery = useQuery(
    getTokenPriceHistoryQueryOptions({
      target: restTarget,
      duration,
      enabled: commonEnabled && needsFallback,
      keepPreviousData: true,
      select: selectPriceChartData,
    }),
  )
  const fallbackLoading = isQueryLoading(fallbackQuery)
  const fallbackCandles = useMemo(() => sortedAscendingCandles(fallbackQuery.data ?? []), [fallbackQuery.data])

  // Hook B: pinned-DAY OHLC for 24h stats, whatever the window. Polls at Hook A's cadence so the 24h
  // stats stay live.
  const { candles: dayCandlesRaw, refetch: refetchDay } = useMarginDayCandles({
    target: restTarget,
    enabled: commonEnabled,
    refetchInterval,
  })

  // Spot price for the volatile leg, patched onto the trailing bar to keep the chart ending at the live price.
  const currencyId = address ? buildCurrencyId(UniverseChainId.Mainnet, address) : undefined
  const spotPrice = useTokenSpotPrice(currencyId, { skip: !currencyId, refetchInterval })

  const refetch = useEvent(() => {
    mainQuery.refetch().catch(() => {})
    if (needsFallback) {
      fallbackQuery.refetch().catch(() => {})
    }
    refetchDay().catch(() => {})
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
    // Quality runs on the raw (unpatched) series; the patched series only renders.
    const rawCandles = needsFallback ? fallbackCandles : mainOhlcMapped
    const quality = checkDataQuality({ data: rawCandles, chartType: ChartType.PRICE, duration })
    const candles = appendOrPatchSpotBar({ candles: rawCandles, spotPrice })

    return {
      candles,
      quality,
      candlesUnavailable: needsFallback,
      stats24h: deriveStats24h({ dayCandles: dayCandlesRaw }),
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
    mainLoading,
    fallbackLoading,
    mainError,
    fallbackError,
    refetch,
  ])
}
