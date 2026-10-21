import type { UTCTimestamp } from 'lightweight-charts'
import { opacify } from 'ui/src/theme'
import { describe, expect, it } from 'vitest'
import { colorVolumeBars, mapVolumePoints, snapVolumeBars } from '~/pages/Swap/Margin/chart/useMarginVolume'

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

describe('snapVolumeBars', () => {
  const candleTimes = [100, 200, 300] as UTCTimestamp[]
  const bar = (time: number, value: number): { time: UTCTimestamp; value: number } => ({
    time: time as UTCTimestamp,
    value,
  })

  it('floors each bar to its candle and drops bars before the first candle', () => {
    expect(snapVolumeBars({ bars: [bar(250, 5), bar(50, 9)], candleTimes })).toEqual([{ time: 200, value: 5 }])
  })

  it('dedupes bars that collapse onto one candle (last wins), strictly ascending', () => {
    expect(snapVolumeBars({ bars: [bar(210, 1), bar(250, 2)], candleTimes })).toEqual([{ time: 200, value: 2 }])
  })
})
