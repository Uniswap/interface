import type { UTCTimestamp } from 'lightweight-charts'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import {
  buildCandles,
  CANDLE_INTERVALS,
  type CandleInterval,
  getCandleIntervalOptions,
  getDefaultCandleInterval,
  getSeriesResolution,
} from '~/pages/PoolDetails/components/ChartSection/candles'

function flat(time: number, price: number): PriceChartData {
  return { time: time as UTCTimestamp, value: price, open: price, high: price, low: price, close: price }
}

function interval(id: string): CandleInterval {
  const found = CANDLE_INTERVALS.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`no interval ${id}`)
  }
  return found
}

/** `count` samples `step` apart from `start`, then a trailing live point `liveGap` after the last. */
function series({
  start = 0,
  step,
  count,
  liveGap,
}: {
  start?: number
  step: number
  count: number
  liveGap?: number
}): PriceChartData[] {
  const entries = Array.from({ length: count }, (_, i) => flat(start + i * step, 100 + i))
  if (liveGap !== undefined) {
    entries.push(flat(start + (count - 1) * step + liveGap, 999))
  }
  return entries
}

const ids = (options: CandleInterval[]): string[] => options.map(({ id }) => id)

describe('getSeriesResolution', () => {
  it('takes the median step, ignoring the off-grid live point', () => {
    expect(getSeriesResolution(series({ step: 600, count: 144, liveGap: 37 }))).toBe(600)
  })

  it('is undefined with fewer than two distinct times', () => {
    expect(getSeriesResolution([])).toBeUndefined()
    expect(getSeriesResolution([flat(5, 1)])).toBeUndefined()
    expect(getSeriesResolution([flat(5, 1), flat(5, 2)])).toBeUndefined()
  })
})

describe('getCandleIntervalOptions', () => {
  // The liquidity service's sampling per period: 1D every 10m, 1W hourly, 1M every 8h, 1Y and All daily.
  it.each([
    ['1D', 600, 144, ['30m', '1h'], '30m'],
    ['1W', 3600, 168, ['1h', '4h', '8h'], '4h'],
    ['1M', 28800, 90, ['8h', '1d'], '1d'],
    ['1Y', 86400, 365, ['1d', '1w', '30d'], '1w'],
    ['All', 86400, 2007, ['1w', '30d'], '30d'],
  ])('%s offers only buildable, readable intervals', (_period, step, count, expected, expectedDefault) => {
    const entries = series({ step, count, liveGap: 120 })
    const options = getCandleIntervalOptions(entries)
    expect(ids(options)).toEqual(expected)
    expect(getDefaultCandleInterval(options, entries)?.id).toBe(expectedDefault)
  })

  it('falls back to the finest buildable interval when none gives a readable count', () => {
    expect(ids(getCandleIntervalOptions(series({ step: 3600, count: 5 })))).toEqual(['1h'])
  })

  it('offers nothing without a resolution', () => {
    expect(getCandleIntervalOptions([flat(0, 1)])).toEqual([])
  })
})

describe('buildCandles', () => {
  it('buckets samples into OHLC, opening each candle at the previous close', () => {
    const entries = [flat(0, 10), flat(600, 12), flat(1200, 9), flat(1800, 11), flat(2400, 15), flat(3000, 14)]
    expect(buildCandles(entries, interval('30m'))).toEqual([
      { time: 0, open: 10, high: 12, low: 9, close: 9, value: 9 },
      { time: 1800, open: 9, high: 15, low: 9, close: 14, value: 14 },
    ])
  })

  it('stamps candles with their bucket start and closes the last at the latest price', () => {
    const entries = [flat(3700, 5), flat(7300, 6), flat(7400, 4)]
    expect(buildCandles(entries, interval('1h'))).toEqual([
      { time: 3600, open: 5, high: 5, low: 5, close: 5, value: 5 },
      { time: 7200, open: 5, high: 6, low: 4, close: 4, value: 4 },
    ])
  })

  it('closes the last candle at the trailing live point, in its own bucket or the last one', () => {
    // Hourly samples, then the live spot 20 minutes on (same 4h bucket) or 3 hours on (the next one).
    for (const liveGap of [20 * 60, 3 * 3600]) {
      const candles = buildCandles(series({ step: 3600, count: 24, liveGap }), interval('4h'))
      expect(candles[candles.length - 1].close).toBe(999)
    }
  })

  it('skips an empty bucket rather than filling it, and opens after the gap at the last close', () => {
    expect(buildCandles([flat(0, 10), flat(7200, 12)], interval('1h'))).toEqual([
      { time: 0, open: 10, high: 10, low: 10, close: 10, value: 10 },
      { time: 7200, open: 10, high: 12, low: 10, close: 12, value: 12 },
    ])
  })

  it('starts weekly candles on Monday 00:00 UTC', () => {
    // 2026-11-04 (a Wednesday) 12:00 UTC falls in the week starting Monday 2026-11-02.
    const wednesday = Date.UTC(2026, 10, 4, 12) / 1000
    const [candle] = buildCandles([flat(wednesday, 1)], interval('1w'))
    expect(candle.time).toBe(Date.UTC(2026, 10, 2) / 1000)
  })

  it('leaves no gaps between consecutive candles', () => {
    const candles = buildCandles(series({ step: 600, count: 144 }), interval('1h'))
    expect(candles).toHaveLength(24)
    candles.slice(1).forEach((candle, i) => expect(candle.open).toBe(candles[i].close))
  })

  it('is empty for an empty series', () => {
    expect(buildCandles([], interval('1h'))).toEqual([])
  })
})
