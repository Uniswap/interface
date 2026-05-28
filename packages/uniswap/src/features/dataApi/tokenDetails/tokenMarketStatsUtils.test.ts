import {
  clamp52wWithCurrentPrice,
  computeTokenMarketStats,
} from 'uniswap/src/features/dataApi/tokenDetails/tokenMarketStatsUtils'
import { describe, expect, it } from 'vitest'

describe('clamp52wWithCurrentPrice', () => {
  it('should return max of currentPrice and rawHigh for high52w when both are defined', () => {
    expect(clamp52wWithCurrentPrice({ currentPrice: 100, rawHigh: 90, rawLow: 50 })).toEqual({
      high52w: 100,
      low52w: 50,
    })
    expect(clamp52wWithCurrentPrice({ currentPrice: 80, rawHigh: 120, rawLow: 40 })).toEqual({
      high52w: 120,
      low52w: 40,
    })
  })

  it('should return min of currentPrice and rawLow for low52w when both are defined', () => {
    expect(clamp52wWithCurrentPrice({ currentPrice: 60, rawHigh: 100, rawLow: 80 })).toEqual({
      high52w: 100,
      low52w: 60,
    })
    expect(clamp52wWithCurrentPrice({ currentPrice: 30, rawHigh: 100, rawLow: 50 })).toEqual({
      high52w: 100,
      low52w: 30,
    })
  })

  it('should return rawHigh and rawLow when currentPrice is undefined', () => {
    expect(clamp52wWithCurrentPrice({ currentPrice: undefined, rawHigh: 100, rawLow: 20 })).toEqual({
      high52w: 100,
      low52w: 20,
    })
  })

  it('should return rawHigh/rawLow when raw values are undefined (currentPrice does not fill in)', () => {
    expect(clamp52wWithCurrentPrice({ currentPrice: 50, rawHigh: undefined, rawLow: undefined })).toEqual({
      high52w: undefined,
      low52w: undefined,
    })
  })

  it('should return undefined high52w when rawHigh is undefined', () => {
    expect(clamp52wWithCurrentPrice({ currentPrice: 50, rawHigh: undefined, rawLow: 10 })).toEqual({
      high52w: undefined,
      low52w: 10,
    })
  })

  it('should return undefined low52w when rawLow is undefined', () => {
    expect(clamp52wWithCurrentPrice({ currentPrice: 50, rawHigh: 100, rawLow: undefined })).toEqual({
      high52w: 100,
      low52w: undefined,
    })
  })
})

describe('computeTokenMarketStats', () => {
  it('should resolve price from currentPrice then projectMarket then market', () => {
    // With only currentPrice and no 52w data, high52w/low52w stay undefined
    const no52w = computeTokenMarketStats({
      currentPrice: 1,
      projectMarket: { price: { value: 2 } },
      market: { price: { value: 3 } },
    })
    expect(no52w.high52w).toBeUndefined()
    expect(no52w.low52w).toBeUndefined()

    const withOverride = computeTokenMarketStats({
      currentPrice: 10,
      projectMarket: { price: { value: 2 }, priceHigh52W: { value: 5 }, priceLow52W: { value: 1 } },
      market: {},
    })
    expect(withOverride.high52w).toBe(10)
    expect(withOverride.low52w).toBe(1)

    const fromProject = computeTokenMarketStats({
      projectMarket: { price: { value: 7 }, priceHigh52W: { value: 8 }, priceLow52W: { value: 6 } },
      market: { price: { value: 4 } },
    })
    expect(fromProject.high52w).toBe(8)
    expect(fromProject.low52w).toBe(6)

    const fromMarket = computeTokenMarketStats({
      market: { price: { value: 9 }, priceHigh52W: { value: 11 }, priceLow52W: { value: 5 } },
    })
    expect(fromMarket.high52w).toBe(11)
    expect(fromMarket.low52w).toBe(5)
  })

  it('should prefer projectMarket for marketCap and fdv', () => {
    const result = computeTokenMarketStats({
      projectMarket: { marketCap: { value: 1_000_000 }, fullyDilutedValuation: { value: 2_000_000 } },
      market: {},
    })
    expect(result.marketCap).toBe(1_000_000)
    expect(result.fdv).toBe(2_000_000)
  })

  it('should resolve volume from volume24H then volume on market', () => {
    expect(computeTokenMarketStats({ market: { volume24H: { value: 100 }, volume: { value: 200 } } }).volume).toBe(100)
    expect(computeTokenMarketStats({ market: { volume: { value: 200 } } }).volume).toBe(200)
    expect(computeTokenMarketStats({ market: {} }).volume).toBeUndefined()
  })

  it('should prefer projectMarket 52w then market 52w for raw high/low before clamping', () => {
    const result = computeTokenMarketStats({
      currentPrice: 50,
      projectMarket: { priceHigh52W: { value: 60 }, priceLow52W: { value: 40 } },
      market: { priceHigh52W: { value: 70 }, priceLow52W: { value: 30 } },
    })
    expect(result.high52w).toBe(60)
    expect(result.low52w).toBe(40)
  })

  it('should fall back to market 52w when projectMarket 52w is missing', () => {
    const result = computeTokenMarketStats({
      currentPrice: 50,
      projectMarket: {},
      market: { price: { value: 50 }, priceHigh52W: { value: 80 }, priceLow52W: { value: 20 } },
    })
    expect(result.high52w).toBe(80)
    expect(result.low52w).toBe(20)
  })

  it('should clamp 52w high to at least current price and low to at most current price', () => {
    const result = computeTokenMarketStats({
      currentPrice: 55,
      projectMarket: { priceHigh52W: { value: 50 }, priceLow52W: { value: 60 } },
    })
    expect(result.high52w).toBe(55)
    expect(result.low52w).toBe(55)
  })

  it('should return all undefined when given no inputs', () => {
    expect(computeTokenMarketStats({})).toEqual({
      marketCap: undefined,
      fdv: undefined,
      volume: undefined,
      high52w: undefined,
      low52w: undefined,
    })
  })
})
