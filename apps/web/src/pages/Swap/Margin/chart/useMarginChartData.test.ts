import { describe, expect, it } from 'vitest'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import type { MarginMarket } from '~/constants/margin'
import { TimePeriod } from '~/data/util'
import {
  deriveStats24h,
  ohlcToCandles,
  priceHistoryToCandles,
  timeframeToTimePeriod,
  volatileLeg,
  type MarginChartTimeframe,
  type TimestampedOhlcLike,
} from '~/pages/Swap/Margin/chart/useMarginChartData'

describe('timeframeToTimePeriod', () => {
  it.each([
    ['1H', TimePeriod.HOUR],
    ['1D', TimePeriod.DAY],
    ['1W', TimePeriod.WEEK],
    ['1M', TimePeriod.MONTH],
    ['1Y', TimePeriod.YEAR],
    ['ALL', TimePeriod.MAX],
  ] as Array<[MarginChartTimeframe, TimePeriod]>)('%s → %s', (tf, expected) => {
    expect(timeframeToTimePeriod({ timeframe: tf })).toBe(expected)
  })
})

describe('volatileLeg', () => {
  const base = {
    collateral: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 },
    debt: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
  }
  // Stable collateral / volatile debt — identity alone resolves this, no direction needed.
  const short = {
    collateral: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
    debt: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 },
  }
  it('LONG (direction absent) → collateral', () =>
    expect(volatileLeg({ market: base as MarginMarket }).symbol).toBe('WETH'))
  it('SHORT (direction absent) → debt', () =>
    expect(volatileLeg({ market: short as MarginMarket }).symbol).toBe('WETH'))
})

describe('ohlcToCandles', () => {
  it('drops nulls, floors to whole seconds, sorts+dedupes (last wins), sets value=close', () => {
    const p = (n: number): { value: number } => ({ value: n })
    const raw: Array<TimestampedOhlcLike | null> = [
      { timestamp: 200, open: p(2), high: p(3), low: p(1), close: p(2.5) },
      null,
      { timestamp: 100.9, open: p(1), high: p(2), low: p(0.5), close: p(2) },
      { timestamp: 200, open: p(9), high: p(9), low: p(9), close: p(9) },
    ]
    const out = ohlcToCandles({ ohlc: raw })
    expect(out.map((c) => c.time)).toEqual([100, 200])
    expect(out[1]?.close).toBe(9) // later duplicate replaces
    expect(out[1]?.value).toBe(out[1]?.close)
  })
})

describe('deriveStats24h', () => {
  it('baseline = first CLOSE (app convention), high/low from extremes', () => {
    const day = [
      { time: 0, open: 90, high: 110, low: 95, close: 100, value: 100 },
      { time: 3600, open: 100, high: 130, low: 90, close: 120, value: 120 },
    ] as PriceChartData[]
    expect(deriveStats24h({ dayCandles: day })).toEqual({ changePct: 20, high: 130, low: 90 })
  })
  it('empty → all undefined', () =>
    expect(deriveStats24h({ dayCandles: [] })).toEqual({ changePct: undefined, high: undefined, low: undefined }))
  it('baseline ≤ 0 → changePct undefined, extremes still reported', () => {
    const day = [
      { time: 0, open: 0, high: 110, low: 90, close: 0, value: 0 },
      { time: 3600, open: 100, high: 130, low: 100, close: 120, value: 120 },
    ] as PriceChartData[]
    expect(deriveStats24h({ dayCandles: day })).toEqual({ changePct: undefined, high: 130, low: 90 })
  })
  it('all-zero degraded series → extremes omitted, no $0 H/L (A5)', () => {
    const zero = { open: 0, high: 0, low: 0, close: 0, value: 0 }
    const day = [
      { time: 0, ...zero },
      { time: 3600, ...zero },
      { time: 7200, ...zero },
    ] as PriceChartData[]
    expect(deriveStats24h({ dayCandles: day })).toEqual({ changePct: undefined, high: undefined, low: undefined })
  })
  it('non-finite extremes → omitted (A5)', () => {
    const day = [{ time: 0, open: NaN, high: NaN, low: NaN, close: NaN, value: NaN }] as PriceChartData[]
    const out = deriveStats24h({ dayCandles: day })
    expect(out.high).toBeUndefined()
    expect(out.low).toBeUndefined()
  })
})

describe('priceHistoryToCandles (fallback line path)', () => {
  it('sorts out-of-order points before ascending-dedupe so none are dropped', () => {
    const raw = [
      { timestamp: 300, value: 3 },
      { timestamp: 100, value: 1 },
      { timestamp: 200, value: 2 },
    ]
    const out = priceHistoryToCandles({ priceHistory: raw })
    expect(out.map((c) => c.time)).toEqual([100, 200, 300])
    expect(out.map((c) => c.value)).toEqual([1, 2, 3])
  })
})
