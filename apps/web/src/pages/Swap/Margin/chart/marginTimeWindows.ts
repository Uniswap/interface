import { type Message, type PlainMessage, Timestamp, toPlainMessage } from '@bufbuild/protobuf'
import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { OhlcResolution } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { PollingInterval } from 'uniswap/src/constants/misc'
import type { HistoryTarget } from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { HOURS_IN_DAY, MINUTES_IN_HOUR, SECONDS_IN_MINUTE } from 'utilities/src/time/time'

// How much time the chart shows, not the candle width.
export const MARGIN_TIME_WINDOW_OPTIONS = ['4H', '1D', '1W', '1M', '1Y'] as const
export type MarginTimeWindow = (typeof MARGIN_TIME_WINDOW_OPTIONS)[number]

const ONE_HOUR_SECONDS = MINUTES_IN_HOUR * SECONDS_IN_MINUTE
const ONE_DAY_SECONDS = HOURS_IN_DAY * ONE_HOUR_SECONDS
const FIVE_MINUTE_SECONDS = 5 * SECONDS_IN_MINUTE
const TEN_MINUTE_SECONDS = 10 * SECONDS_IN_MINUTE
const FOUR_HOUR_SECONDS = 4 * ONE_HOUR_SECONDS
const TWO_DAY_SECONDS = 2 * ONE_DAY_SECONDS

/**
 * Each window is one DataAPI ranged request (candles and volume alike, so their timestamps match one to
 * one) at the finest resolution that stays under the 400-point cap. `candleSeconds` is the drawn candle
 * width, a multiple of the fetched one: 1D (288 5-min) and 1Y (366 daily) merge onto a coarser grid to
 * draw ~145-185 candles like 1W (168) and 1M (180). `duration` covers the window, for the line-only
 * fallback and the staleness check.
 */
export const MARGIN_TIME_WINDOWS: Record<
  MarginTimeWindow,
  { windowSeconds: number; resolution: OhlcResolution; candleSeconds: number; duration: HistoryDuration }
> = {
  '4H': {
    windowSeconds: 4 * ONE_HOUR_SECONDS,
    resolution: OhlcResolution.FIVE_MINUTE,
    candleSeconds: FIVE_MINUTE_SECONDS,
    duration: HistoryDuration.Day,
  },
  '1D': {
    windowSeconds: ONE_DAY_SECONDS,
    resolution: OhlcResolution.FIVE_MINUTE,
    candleSeconds: TEN_MINUTE_SECONDS,
    duration: HistoryDuration.Day,
  },
  '1W': {
    windowSeconds: 7 * ONE_DAY_SECONDS,
    resolution: OhlcResolution.ONE_HOUR,
    candleSeconds: ONE_HOUR_SECONDS,
    duration: HistoryDuration.Week,
  },
  '1M': {
    windowSeconds: 30 * ONE_DAY_SECONDS,
    resolution: OhlcResolution.FOUR_HOUR,
    candleSeconds: FOUR_HOUR_SECONDS,
    duration: HistoryDuration.Month,
  },
  '1Y': {
    windowSeconds: 365 * ONE_DAY_SECONDS,
    resolution: OhlcResolution.ONE_DAY,
    candleSeconds: TWO_DAY_SECONDS,
    duration: HistoryDuration.Year,
  },
}

/** Start (unix seconds) of the `candleSeconds` candle holding `time`. */
export function marginCandleStart({ time, candleSeconds }: { time: number; candleSeconds: number }): number {
  return Math.floor(time / candleSeconds) * candleSeconds
}

/**
 * One ranged DataAPI history query (OHLC or volume) covering `timeWindow` up to `nowSeconds`. Keyed on
 * the start seconds rather than on the request: a protobuf Timestamp carries a bigint, which query-key
 * hashing cannot serialize. The start is the drawn candle holding `nowSeconds - windowSeconds` (flooring
 * the window start itself keeps 1Y on its 2-day grid, as 365 days is not a whole number of candles), so
 * the window (and the key) only moves when a new candle opens and the first candle is never a partial
 * bucket; polling keeps the open candle live in between (react-query pauses it while the tab is hidden).
 */
export function getMarginHistoryQueryOptions<TResponse extends Message<TResponse>, TSelected>({
  name,
  fetch,
  target,
  timeWindow,
  nowSeconds,
  enabled,
  select,
}: {
  name: 'getTokenHistoryOHLC' | 'getTokenHistoryVolume'
  fetch: (params: { target: HistoryTarget; resolution: OhlcResolution; startTime: Timestamp }) => Promise<TResponse>
  target: HistoryTarget | undefined
  timeWindow: MarginTimeWindow
  nowSeconds: number
  enabled: boolean
  select: (data: PlainMessage<TResponse>) => TSelected
}) {
  const { windowSeconds, resolution, candleSeconds } = MARGIN_TIME_WINDOWS[timeWindow]
  const startSeconds = marginCandleStart({ time: nowSeconds - windowSeconds, candleSeconds })
  return queryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, name, { target, resolution, startSeconds }],
    queryFn: async (): Promise<PlainMessage<TResponse>> =>
      toPlainMessage(await fetch({ target, resolution, startTime: new Timestamp({ seconds: BigInt(startSeconds) }) })),
    enabled: enabled && !!target,
    placeholderData: keepPreviousData,
    select,
    refetchInterval: PollingInterval.KindaFast,
  })
}
