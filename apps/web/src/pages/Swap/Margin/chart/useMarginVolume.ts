import { type PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { GetTokenHistoryVolumeResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { UniverseChainId } from '@universe/chains'
import { opacify } from '@universe/mycelium/theme-hooks-compat'
import type { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import type { MarginMarket } from '~/constants/margin'
import { useRestHistoryTarget } from '~/hooks/useRestHistoryTarget'
import type { TokenPriceChartQueryVariables } from '~/hooks/useTokenPriceChartData'
import {
  getMarginHistoryQueryOptions,
  MARGIN_TIME_WINDOWS,
  type MarginTimeWindow,
} from '~/pages/Swap/Margin/chart/marginTimeWindows'
import { volatileLeg } from '~/pages/Swap/Margin/chart/useMarginChartData'

// One histogram bar for the volume overlay: whole-second time + volume value. Kept minimal (no OHLC)
// so the model can setData it directly as lightweight-charts HistogramData.
export interface MarginVolumeBar {
  time: UTCTimestamp
  value: number
}

type VolumeHistoryPoint = { timestamp: number; value: number }

// Raw historical-volume points → histogram bars: drop gaps, floor to whole seconds, sort ascending,
// then collapse to strictly-ascending unique times (setData requires it; duplicates keep the latest).
// The price path's toStrictlyAscendingByTime is typed for full OHLC candles, so volume dedupes here.
export function mapVolumePoints({ raw }: { raw: ReadonlyArray<VolumeHistoryPoint | undefined> }): MarginVolumeBar[] {
  const mapped = raw
    .filter((p): p is VolumeHistoryPoint => p !== undefined)
    .map((p) => ({ time: Math.floor(p.timestamp) as UTCTimestamp, value: p.value }))
  mapped.sort((a, b) => (a.time as number) - (b.time as number))
  const ascending: MarginVolumeBar[] = []
  let lastTime: number | undefined
  for (const bar of mapped) {
    if (lastTime === undefined || bar.time > lastTime) {
      ascending.push(bar)
      lastTime = bar.time
    } else if (bar.time === lastTime) {
      ascending[ascending.length - 1] = bar
    }
  }
  return ascending
}

// DataAPI volume buckets → histogram bars, reusing mapVolumePoints' floor/sort/dedupe. Bucket
// timestamps are bucket-start unix SECONDS, sent as int64 strings on the wire and decoded to bigint by
// the client; converted explicitly here. A bucket with no priced swap has no volume_usd: zero.
export function selectVolumeBars(data: PlainMessage<GetTokenHistoryVolumeResponse> | undefined): MarginVolumeBar[] {
  return mapVolumePoints({
    raw: (data?.buckets ?? []).map((bucket) => ({ timestamp: Number(bucket.timestamp), value: bucket.volumeUsd ?? 0 })),
  })
}

/** Sums ascending bars into `candleSeconds` buckets on the absolute time grid, the volume twin of mergeCandlesToGrid. */
export function mergeVolumeToGrid({
  bars,
  candleSeconds,
}: {
  bars: MarginVolumeBar[]
  candleSeconds: number
}): MarginVolumeBar[] {
  const merged: MarginVolumeBar[] = []
  for (const bar of bars) {
    const time = (Math.floor(bar.time / candleSeconds) * candleSeconds) as UTCTimestamp
    const last = merged.at(-1)
    if (last?.time === time) {
      merged[merged.length - 1] = { time, value: last.value + bar.value }
    } else {
      merged.push({ time, value: bar.value })
    }
  }
  return merged
}

// 40% alpha keeps bars subordinate to the candles (unchanged from the neutral original).
const VOLUME_BAR_ALPHA = 40

export interface ColoredVolumeBar {
  time: UTCTimestamp
  value: number
  color: string
}

// Color each bar by its candle's direction: opacify(40, close>=open ? success : critical), matched to
// the candle sharing its whole-second time; an unmatched bar keeps the neutral fallback. NOTE: this
// reintroduces a volume↔candle DATA dependency the neutral-only original avoided (exact-time match
// assumes volume timestamps align with candle timestamps — alignVolumeToCandles guarantees it).
export function colorVolumeBars({
  bars,
  candles,
  colors,
}: {
  bars: MarginVolumeBar[]
  candles: ReadonlyArray<{ time: UTCTimestamp; open: number; close: number }>
  colors: { statusSuccess: string; statusCritical: string; neutral2: string }
}): ColoredVolumeBar[] {
  const isUpByTime = new Map<number, boolean>()
  for (const candle of candles) {
    isUpByTime.set(candle.time, candle.close >= candle.open)
  }
  return bars.map((bar) => {
    const isUp = isUpByTime.get(bar.time)
    const base = isUp === undefined ? colors.neutral2 : isUp ? colors.statusSuccess : colors.statusCritical
    return { time: bar.time, value: bar.value, color: opacify(VOLUME_BAR_ALPHA, base) }
  })
}

/**
 * One bar per candle, at the candle's own time: the bucket holding the candle's start. Candles and
 * volume share a grid, so this is an exact match except for the trailing candle, which the spot patch
 * re-stamps to "now" inside its bucket. A bucket feeds at most one candle, so a candle past the last
 * bucket gets no bar, and buckets before the first candle are dropped.
 */
export function alignVolumeToCandles({
  bars,
  candles,
}: {
  bars: MarginVolumeBar[]
  candles: ReadonlyArray<{ time: UTCTimestamp }>
}): MarginVolumeBar[] {
  const aligned: MarginVolumeBar[] = []
  let next = 0
  let holding: MarginVolumeBar | undefined
  let claimed: MarginVolumeBar | undefined
  for (const candle of candles) {
    let bar = bars.at(next)
    while (bar && bar.time <= candle.time) {
      holding = bar
      next += 1
      bar = bars.at(next)
    }
    if (holding && holding !== claimed) {
      aligned.push({ time: candle.time, value: holding.value })
      claimed = holding
    }
  }
  return aligned
}

// Minimal volume data hook (spec F15) for the optional volume pane. Prefs-agnostic by design: the pane
// passes `enabled` (from prefs.volume) so the query is skipped while the overlay is off. Tracks the
// volatile leg + selected time window, on the same ranged request as the candles.
export function useMarginVolume({
  market,
  timeWindow,
  enabled,
}: {
  market: MarginMarket
  timeWindow: MarginTimeWindow
  enabled: boolean
}): { volumeBars: MarginVolumeBar[] } {
  const { address } = volatileLeg({ market })
  const { duration, candleSeconds } = MARGIN_TIME_WINDOWS[timeWindow]
  const variables: TokenPriceChartQueryVariables = {
    chainId: UniverseChainId.Mainnet,
    address,
    duration,
    multichain: false,
  }
  const restTarget = useRestHistoryTarget(variables)
  const { data } = useQuery(
    getMarginHistoryQueryOptions({
      name: 'getTokenHistoryVolume',
      fetch: (params) => dataApiServiceClientV2.getTokenHistoryVolume(params),
      target: restTarget,
      timeWindow,
      nowSeconds: Date.now() / 1000,
      enabled,
      select: selectVolumeBars,
    }),
  )
  return useMemo(() => ({ volumeBars: mergeVolumeToGrid({ bars: data ?? [], candleSeconds }) }), [data, candleSeconds])
}
