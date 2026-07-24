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
      projectMarket: { priceUsd: 2 },
      market: { priceUsd: 3 },
    })
    expect(no52w.high52w).toBeUndefined()
    expect(no52w.low52w).toBeUndefined()

    const withOverride = computeTokenMarketStats({
      currentPrice: 10,
      projectMarket: { priceUsd: 2, priceHigh52wUsd: 5, priceLow52wUsd: 1 },
      market: {},
    })
    expect(withOverride.high52w).toBe(10)
    expect(withOverride.low52w).toBe(1)

    const fromProject = computeTokenMarketStats({
      projectMarket: { priceUsd: 7, priceHigh52wUsd: 8, priceLow52wUsd: 6 },
      market: { priceUsd: 4 },
    })
    expect(fromProject.high52w).toBe(8)
    expect(fromProject.low52w).toBe(6)

    const fromMarket = computeTokenMarketStats({
      market: { priceUsd: 9, priceHigh52wUsd: 11, priceLow52wUsd: 5 },
    })
    expect(fromMarket.high52w).toBe(11)
    expect(fromMarket.low52w).toBe(5)
  })

  it('should prefer projectMarket for marketCap and fdv', () => {
    const result = computeTokenMarketStats({
      projectMarket: { marketCapUsd: 1_000_000, fullyDilutedValuationUsd: 2_000_000 },
      market: {},
    })
    expect(result.marketCap).toBe(1_000_000)
    expect(result.fdv).toBe(2_000_000)
  })

  it('should resolve volume from volumeUsd', () => {
    expect(computeTokenMarketStats({ market: { volumeUsd: 100 } }).volume).toBe(100)
    expect(
      computeTokenMarketStats({
        market: { volumeUsd: 100 },
        projectMarket: { volumeUsd: 300 },
      }).volume,
    ).toBe(100)
    expect(computeTokenMarketStats({ market: {} }).volume).toBeUndefined()
  })

  it('reports volumeSource based on which volume was used', () => {
    expect(computeTokenMarketStats({ market: { volumeUsd: 100 } }).volumeSource).toBe('market')
    expect(
      computeTokenMarketStats({
        preferProjectMarketData: true,
        projectMarket: { volumeUsd: 300 },
        market: { volumeUsd: 100 },
      }).volumeSource,
    ).toBe('project')
    // Project preferred but project volume missing: falls back to Uniswap market volume.
    expect(
      computeTokenMarketStats({
        preferProjectMarketData: true,
        projectMarket: {},
        market: { volumeUsd: 100 },
      }).volumeSource,
    ).toBe('market')
    expect(
      computeTokenMarketStats({ preferProjectMarketData: true, projectMarket: {}, market: {} }).volumeSource,
    ).toBeUndefined()
  })

  it('should use projectMarket price for 52w clamping when project market data is preferred', () => {
    const result = computeTokenMarketStats({
      currentPrice: 100,
      preferProjectMarketData: true,
      projectMarket: {
        priceUsd: 10,
        priceHigh52wUsd: 20,
        priceLow52wUsd: 15,
        volumeUsd: 25,
      },
      market: { priceUsd: 100, volumeUsd: 5 },
    })

    expect(result.high52w).toBe(20)
    expect(result.low52w).toBe(10)
    expect(result.volume).toBe(25)
  })

  it('should prefer projectMarket 52w then market 52w for raw high/low before clamping', () => {
    const result = computeTokenMarketStats({
      currentPrice: 50,
      projectMarket: { priceHigh52wUsd: 60, priceLow52wUsd: 40 },
      market: { priceHigh52wUsd: 70, priceLow52wUsd: 30 },
    })
    expect(result.high52w).toBe(60)
    expect(result.low52w).toBe(40)
  })

  it('should fall back to market 52w when projectMarket 52w is missing', () => {
    const result = computeTokenMarketStats({
      currentPrice: 50,
      projectMarket: {},
      market: { priceUsd: 50, priceHigh52wUsd: 80, priceLow52wUsd: 20 },
    })
    expect(result.high52w).toBe(80)
    expect(result.low52w).toBe(20)
  })

  it('should clamp 52w high to at least current price and low to at most current price', () => {
    const result = computeTokenMarketStats({
      currentPrice: 55,
      projectMarket: { priceHigh52wUsd: 50, priceLow52wUsd: 60 },
    })
    expect(result.high52w).toBe(55)
    expect(result.low52w).toBe(55)
  })

  it('should return all undefined when given no inputs', () => {
    expect(computeTokenMarketStats({})).toEqual({
      marketCap: undefined,
      fdv: undefined,
      volume: undefined,
      volumeSource: undefined,
      high52w: undefined,
      low52w: undefined,
    })
  })
})
