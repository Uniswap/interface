import {
  appendLiveSpotPriceEntry,
  getIsStablecoin,
  getLowVarianceAxisDecimals,
  getSparklineValueDomain,
  isLowVarianceRange,
} from 'uniswap/src/components/charts/utils'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'

// Literals on purpose: deriving them from the 1.5% threshold would let a changed threshold pass.
describe('shared stablecoin flattening rule', () => {
  const day = HistoryDuration.Day
  const tokenPageFlattens = (range: { min: number; max: number; isStablecoin: boolean }): boolean =>
    isLowVarianceRange({ ...range, duration: day })
  const sparklineFlattens = (range: { min: number; max: number; isStablecoin: boolean }): boolean => {
    const [lo, hi] = getSparklineValueDomain(range)
    return lo !== range.min || hi !== range.max
  }

  it.each([
    { name: 'a stablecoin moving 1.0%', range: { min: 1, max: 1.01, isStablecoin: true }, flattened: true },
    {
      name: 'a stablecoin moving just under 1.5%',
      range: { min: 100, max: 101.49, isStablecoin: true },
      flattened: true,
    },
    { name: 'a stablecoin moving exactly 1.5%', range: { min: 100, max: 101.5, isStablecoin: true }, flattened: false },
    { name: 'a stablecoin moving 1.6%', range: { min: 1, max: 1.016, isStablecoin: true }, flattened: false },
    { name: 'a depegged stablecoin', range: { min: 0.8, max: 1, isStablecoin: true }, flattened: false },
    { name: 'a non-stablecoin moving 0.1%', range: { min: 1, max: 1.001, isStablecoin: false }, flattened: false },
    { name: 'a quiet ETH day (~1.3%)', range: { min: 4500, max: 4560, isStablecoin: false }, flattened: false },
  ])('agrees on the token page chart and sparkline for $name', ({ range, flattened }) => {
    expect(tokenPageFlattens(range)).toBe(flattened)
    expect(sparklineFlattens(range)).toBe(flattened)
  })

  it('ignores the chart duration for token charts', () => {
    const range = { min: 1, max: 1.01, isStablecoin: true }
    for (const duration of [HistoryDuration.Hour, HistoryDuration.Week, HistoryDuration.Max, undefined]) {
      expect(isLowVarianceRange({ ...range, duration })).toBe(true)
    }
  })
})

describe('isLowVarianceRange without a token category', () => {
  // XAUt over a very quiet day: ~0.34%, under the 0.5% range-only cutoff
  const flatGoldDay = { min: 4146, max: 4160, duration: HistoryDuration.Day }

  it('judges on the range alone', () => {
    expect(isLowVarianceRange(flatGoldDay)).toBe(true)
    expect(isLowVarianceRange({ min: 4000, max: 4200, duration: HistoryDuration.Day })).toBe(false)
  })

  it('does not flatten a quiet ETH day or hour', () => {
    const quietEth = { min: 4500, max: 4560 }
    expect(isLowVarianceRange({ ...quietEth, duration: HistoryDuration.Day })).toBe(false)
    expect(isLowVarianceRange({ ...quietEth, duration: HistoryDuration.Hour })).toBe(false)
    expect(isLowVarianceRange({ min: 4500, max: 4530, duration: HistoryDuration.Day })).toBe(false)
  })

  it('returns false without a duration', () => {
    expect(isLowVarianceRange({ min: 1, max: 1 })).toBe(false)
  })
})

describe('getSparklineValueDomain', () => {
  const expectDomain = (actual: [number, number], expected: [number, number]): void => {
    expect(actual[0]).toBeCloseTo(expected[0], 10)
    expect(actual[1]).toBeCloseTo(expected[1], 10)
  }

  it('shrinks a flat stablecoin range to the middle 2% of the chart', () => {
    expectDomain(getSparklineValueDomain({ min: 1, max: 1.01, isStablecoin: true }), [0.755, 1.255])
    expectDomain(getSparklineValueDomain({ min: 0.9998, max: 1.0002, isStablecoin: true }), [0.99, 1.01])
    // Centred on where the price actually is, not on $1
    expectDomain(getSparklineValueDomain({ min: 0.9988, max: 0.9992, isStablecoin: true }), [0.989, 1.009])
  })

  it('centres a constant stablecoin series', () => {
    expectDomain(getSparklineValueDomain({ min: 1, max: 1, isStablecoin: true }), [0.5, 1.5])
  })

  it('keeps every other range at its own min/max', () => {
    expect(getSparklineValueDomain({ min: 0.9998, max: 1.0002, isStablecoin: false })).toEqual([0.9998, 1.0002])
    expect(getSparklineValueDomain({ min: 1, max: 1, isStablecoin: false })).toEqual([1, 1])
    expect(getSparklineValueDomain({ min: 0, max: 0, isStablecoin: true })).toEqual([0, 0])
    expect(getSparklineValueDomain({ min: Number.NaN, max: 1, isStablecoin: true })).toEqual([Number.NaN, 1])
  })
})

describe('getIsStablecoin', () => {
  it('is undefined with Token Categories off, keeping range-only behavior', () => {
    expect(getIsStablecoin({ tokenCategoriesEnabled: false, categoryIds: ['stablecoins'] })).toBeUndefined()
    expect(getIsStablecoin({ tokenCategoriesEnabled: false, categoryIds: ['commodities'] })).toBeUndefined()
  })

  it('is undefined until tags are known', () => {
    expect(getIsStablecoin({ tokenCategoriesEnabled: true, categoryIds: undefined })).toBeUndefined()
  })

  it('reports stablecoin membership from the tags', () => {
    expect(getIsStablecoin({ tokenCategoriesEnabled: true, categoryIds: ['majors', 'stablecoins'] })).toBe(true)
    expect(getIsStablecoin({ tokenCategoriesEnabled: true, categoryIds: ['commodities'] })).toBe(false)
    expect(getIsStablecoin({ tokenCategoriesEnabled: true, categoryIds: [] })).toBe(false)
  })
})

describe('getLowVarianceAxisDecimals', () => {
  it('returns undefined for normal/wide ranges', () => {
    expect(getLowVarianceAxisDecimals(2000, 3500)).toBeUndefined()
    expect(getLowVarianceAxisDecimals(0.5, 1.5)).toBeUndefined()
  })

  it('adds precision for a tight stablecoin range near $1', () => {
    // range 0.004 -> ceil(-log10(0.004)) + 1 = 3 + 1 = 4
    expect(getLowVarianceAxisDecimals(0.998, 1.002)).toBe(4)
  })

  it('scales precision with how tight the range is, capped at 8', () => {
    expect(getLowVarianceAxisDecimals(0.9999, 1.0001)).toBe(5)
    expect(getLowVarianceAxisDecimals(1, 1 + 1e-9)).toBe(8)
  })

  it('never drops below 2 decimals', () => {
    // tight but large-magnitude range: ceil(-log10(40)) + 1 < 2 -> clamped to 2
    expect(getLowVarianceAxisDecimals(2000, 2040)).toBe(2)
  })

  it('returns undefined for degenerate input', () => {
    expect(getLowVarianceAxisDecimals(0, 1)).toBeUndefined()
    expect(getLowVarianceAxisDecimals(-1, 1)).toBeUndefined()
    expect(getLowVarianceAxisDecimals(1, 1)).toBeUndefined()
    expect(getLowVarianceAxisDecimals(2, 1)).toBeUndefined()
    expect(getLowVarianceAxisDecimals(Number.NaN, 1)).toBeUndefined()
  })
})

type Point = { time: number; value: number }

function point(time: number, value: number): Point {
  return { time, value }
}

const createEntry = ({ time, price }: { time: number; price: number }): Point => ({ time, value: price })
const updateEntry = (entry: Point, { time, price }: { time: number; price: number }): Point => ({
  ...entry,
  time,
  value: price,
})

describe('appendLiveSpotPriceEntry', () => {
  const entries = [point(1000, 10), point(2000, 11), point(3000, 12)]

  it.each([1500, 2500])('preserves server history when the device clock is behind at %i', (now) => {
    const result = appendLiveSpotPriceEntry({
      entries,
      currentPrice: 15,
      now,
      getTime: (e) => e.time,
      createEntry,
      updateEntry,
    })

    expect(result).toBe(entries)
  })

  it('updates the price when the device clock equals the last server timestamp', () => {
    const result = appendLiveSpotPriceEntry({
      entries,
      currentPrice: 15,
      now: 3000,
      getTime: (e) => e.time,
      createEntry,
      updateEntry,
    })

    expect(result).toEqual([point(1000, 10), point(2000, 11), point(3000, 15)])
  })

  it('updates the last entry in place when the current time is within the last window', () => {
    // granularity is 1000 (2000 -> 3000); 3500 falls within that window past the last entry
    const result = appendLiveSpotPriceEntry({
      entries,
      currentPrice: 15,
      now: 3500,
      getTime: (e) => e.time,
      createEntry,
      updateEntry,
    })

    expect(result).toHaveLength(3)
    expect(result[2]).toEqual({ time: 3500, value: 15 })
  })

  it('appends a new trailing entry when the current time is outside the last window', () => {
    const result = appendLiveSpotPriceEntry({
      entries,
      currentPrice: 15,
      now: 5000,
      getTime: (e) => e.time,
      createEntry,
      updateEntry,
    })

    expect(result).toHaveLength(4)
    expect(result[3]).toEqual({ time: 5000, value: 15 })
  })

  it('does not mutate the input array', () => {
    const original = [...entries]
    appendLiveSpotPriceEntry({
      entries,
      currentPrice: 15,
      now: 5000,
      getTime: (e) => e.time,
      createEntry,
      updateEntry,
    })

    expect(entries).toEqual(original)
  })

  it('is a no-op when there is no current price', () => {
    const result = appendLiveSpotPriceEntry({
      entries,
      currentPrice: undefined,
      now: 5000,
      getTime: (e) => e.time,
      createEntry,
      updateEntry,
    })

    expect(result).toBe(entries)
  })

  it('is a no-op with fewer than two entries', () => {
    const single = [point(1000, 10)]
    const result = appendLiveSpotPriceEntry({
      entries: single,
      currentPrice: 15,
      now: 5000,
      getTime: (e) => e.time,
      createEntry,
      updateEntry,
    })

    expect(result).toBe(single)
  })
})
