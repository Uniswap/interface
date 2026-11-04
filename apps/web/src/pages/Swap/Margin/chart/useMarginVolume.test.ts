import { toPlainMessage } from '@bufbuild/protobuf'
import { GetTokenHistoryVolumeResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { opacify } from '@universe/mycelium/theme-hooks-compat'
import type { UTCTimestamp } from 'lightweight-charts'
import { describe, expect, it } from 'vitest'
import {
  alignVolumeToCandles,
  colorVolumeBars,
  mapVolumePoints,
  mergeVolumeToGrid,
  selectVolumeBars,
} from '~/pages/Swap/Margin/chart/useMarginVolume'

describe('mapVolumePoints', () => {
  it('drops gaps, floors to whole seconds, sorts ascending, dedupes (last wins)', () => {
    const raw = [{ timestamp: 200, value: 5 }, undefined, { timestamp: 100.9, value: 3 }, { timestamp: 200, value: 9 }]
    const out = mapVolumePoints({ raw })
    expect(out.map((b) => b.time)).toEqual([100, 200])
    expect(out[1]?.value).toBe(9) // later duplicate replaces
  })

  it('returns [] for an empty input', () => {
    expect(mapVolumePoints({ raw: [] })).toEqual([])
  })
})

describe('colorVolumeBars', () => {
  const colors = { statusSuccess: '#21c95e', statusCritical: '#fa2b39', neutral2: '#7d7d7d' }
  const bar = (time: number, value: number): { time: UTCTimestamp; value: number } => ({
    time: time as UTCTimestamp,
    value,
  })

  it('colors each bar by its candle direction (close>=open ⇒ success, else critical)', () => {
    const candles = [
      { time: 100 as UTCTimestamp, open: 10, close: 12 }, // up
      { time: 200 as UTCTimestamp, open: 12, close: 9 }, // down
    ]
    expect(colorVolumeBars({ bars: [bar(100, 5), bar(200, 7)], candles, colors })).toEqual([
      { time: 100, value: 5, color: opacify(40, colors.statusSuccess) },
      { time: 200, value: 7, color: opacify(40, colors.statusCritical) },
    ])
  })

  it('keeps the neutral fallback (and original time) for a bar with no matching candle', () => {
    const out = colorVolumeBars({
      bars: [bar(999, 1)],
      candles: [{ time: 100 as UTCTimestamp, open: 1, close: 2 }],
      colors,
    })
    expect(out).toEqual([{ time: 999, value: 1, color: opacify(40, colors.neutral2) }])
  })

  it('treats equal open/close (line-only candles) as up', () => {
    const out = colorVolumeBars({
      bars: [bar(100, 1)],
      candles: [{ time: 100 as UTCTimestamp, open: 5, close: 5 }],
      colors,
    })
    expect(out[0]?.color).toBe(opacify(40, colors.statusSuccess))
  })
})

describe('selectVolumeBars', () => {
  it('reads the wire shape: string-second bucket starts, missing volume as zero', () => {
    const response = toPlainMessage(
      GetTokenHistoryVolumeResponse.fromJson({
        buckets: [
          { timestamp: '1791417600', volumeUsd: 87552541.88316175 },
          { timestamp: '1791396000', volumeUsd: 68303141.3866859 },
          { timestamp: '1791439200' },
        ],
      }),
    )
    expect(selectVolumeBars(response)).toEqual([
      { time: 1791396000, value: 68303141.3866859 },
      { time: 1791417600, value: 87552541.88316175 },
      { time: 1791439200, value: 0 },
    ])
  })
})

const vol = (time: number, value: number): { time: UTCTimestamp; value: number } => ({
  time: time as UTCTimestamp,
  value,
})

describe('alignVolumeToCandles', () => {
  const candle = (time: number): { time: UTCTimestamp } => ({ time: time as UTCTimestamp })
  // Ranged FOUR_HOUR candles and volume (prod, 2026-10-16) share their bucket starts.
  const buckets = [
    vol(1792123200, 56657678.536191136),
    vol(1792137600, 85894529.42039272),
    vol(1792152000, 43772001.2578033),
  ]

  it('pairs each candle with the bucket at its own time', () => {
    const candles = buckets.map((bucket) => candle(bucket.time))
    expect(alignVolumeToCandles({ bars: buckets, candles })).toEqual(buckets)
  })

  it('follows the trailing candle the spot patch re-stamped to "now" inside its bucket', () => {
    const now = 1792159500 // 14:05, inside the 12:00 bucket
    const candles = [candle(1792123200), candle(1792137600), candle(now)]
    expect(alignVolumeToCandles({ bars: buckets, candles })).toEqual([
      vol(1792123200, 56657678.536191136),
      vol(1792137600, 85894529.42039272),
      vol(now, 43772001.2578033),
    ])
  })

  it('gives a candle past the last bucket no bar instead of repeating the last one', () => {
    const candles = [...buckets.map((bucket) => candle(bucket.time)), candle(1792166400)]
    expect(alignVolumeToCandles({ bars: buckets, candles })).toEqual(buckets)
  })

  it('skips a candle whose bucket is missing, and drops buckets before the first candle', () => {
    const candles = [candle(1792137600), candle(1792152000), candle(1792166400), candle(1792180800)]
    const bars = [...buckets, vol(1792180800, 7)]
    expect(alignVolumeToCandles({ bars, candles })).toEqual([
      vol(1792137600, 85894529.42039272),
      vol(1792152000, 43772001.2578033),
      vol(1792180800, 7),
    ])
  })

  it('returns [] with no bars or no candles', () => {
    expect(alignVolumeToCandles({ bars: [], candles: [candle(0)] })).toEqual([])
    expect(alignVolumeToCandles({ bars: [vol(0, 1)], candles: [] })).toEqual([])
  })
})

describe('mergeVolumeToGrid', () => {
  // Ranged ONE_DAY buckets (prod, 2026-10-26) onto 1Y's 2-day grid: Oct 26 closes the bucket that opened
  // Oct 25, Oct 27 and 28 share the next one.
  const days = [
    vol(1761436800, 3504327327.7093306),
    vol(1761523200, 2183865118.309221),
    vol(1761609600, 2378583443.029952),
  ]

  it('sums each bucket so a merged candle carries its whole volume', () => {
    expect(mergeVolumeToGrid({ bars: days, candleSeconds: 172_800 })).toEqual([
      vol(1761350400, 3504327327.7093306),
      vol(1761523200, 2183865118.309221 + 2378583443.029952),
    ])
  })

  it('leaves bars already on the grid as they are', () => {
    expect(mergeVolumeToGrid({ bars: days, candleSeconds: 86_400 })).toEqual(days)
  })
})
