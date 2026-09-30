import { appendLiveSpotPriceEntry, getLowVarianceAxisDecimals } from 'uniswap/src/components/charts/utils'

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
