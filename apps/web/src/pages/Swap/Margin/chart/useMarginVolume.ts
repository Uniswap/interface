import { type PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { GetTokenHistoryVolumeResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { GraphQLApi } from '@universe/api'
import type { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
import { opacify } from 'ui/src/theme'
import { getGetTokenHistoryVolumeQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { toRestHistoryDuration } from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import type { MarginMarket } from '~/constants/margin'
import { useRestHistoryTarget } from '~/hooks/useRestHistoryTarget'
import type { TokenPriceChartQueryVariables } from '~/hooks/useTokenPriceChartData'
import {
  type MarginChartTimeframe,
  timeframeToDuration,
  volatileLeg,
} from '~/pages/Swap/Margin/chart/useMarginChartData'
import { snapToCandleTime } from '~/pages/Swap/Margin/chart/useMarginChartOverlays'

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

// DataAPI volume buckets → histogram bars, reusing mapVolumePoints' floor/sort/dedupe. Replaces the
// GraphQL historicalVolume path: main moved token history onto the DataAPI REST endpoints.
function selectVolumeBars(data: PlainMessage<GetTokenHistoryVolumeResponse> | undefined): MarginVolumeBar[] {
  return mapVolumePoints({
    raw: (data?.buckets ?? []).map((bucket) => ({ timestamp: Number(bucket.timestamp), value: bucket.volumeUsd ?? 0 })),
  })
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
// assumes volume timestamps align with candle timestamps — snapVolumeBars removes that assumption).
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

// Align each bar to the candle it lands on (floor via snapToCandleTime); bars predating the first
// candle drop. Snapping can collapse several bars onto one candle time — re-dedupe to the strictly-
// ascending unique series setData requires (latest wins), mirroring mapVolumePoints. Feeds colorVolumeBars,
// whose exact-time match then hits every snapped bar.
export function snapVolumeBars({
  bars,
  candleTimes,
}: {
  bars: MarginVolumeBar[]
  candleTimes: UTCTimestamp[]
}): MarginVolumeBar[] {
  const snapped: MarginVolumeBar[] = []
  for (const bar of bars) {
    const time = snapToCandleTime({ time: bar.time, candleTimes })
    if (time !== undefined) {
      snapped.push({ time, value: bar.value })
    }
  }
  snapped.sort((a, b) => (a.time as number) - (b.time as number))
  const ascending: MarginVolumeBar[] = []
  let lastTime: number | undefined
  for (const bar of snapped) {
    if (lastTime === undefined || bar.time > lastTime) {
      ascending.push(bar)
      lastTime = bar.time
    } else {
      ascending[ascending.length - 1] = bar
    }
  }
  return ascending
}

// Minimal volume data hook (spec F15) for the optional histogram overlay. Prefs-agnostic by design —
// the pane passes `enabled` (from prefs.volume) so the query is skipped while the overlay is off.
// Tracks the volatile leg + selected timeframe, mirroring the price query's chain/address/duration.
export function useMarginVolume({
  market,
  timeframe,
  enabled,
}: {
  market: MarginMarket
  timeframe: MarginChartTimeframe
  enabled: boolean
}): { volumeBars: MarginVolumeBar[] } {
  const { address } = volatileLeg({ market })
  const duration = timeframeToDuration({ timeframe })
  const variables: TokenPriceChartQueryVariables = {
    chain: GraphQLApi.Chain.Ethereum,
    address,
    duration,
    multichain: false,
  }
  const restTarget = useRestHistoryTarget(variables)
  const { data } = useQuery(
    getGetTokenHistoryVolumeQueryOptions({
      params: { target: restTarget, duration: toRestHistoryDuration(duration) },
      enabled: enabled && !!restTarget,
      keepPreviousData: true,
      select: selectVolumeBars,
    }),
  )
  return useMemo(() => ({ volumeBars: data ?? [] }), [data])
}
