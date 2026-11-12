import {
  clamp52wWithCurrentPrice,
  computeTokenMarketStats,
  getTokenTvlBreakdown,
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

describe('getTokenTvlBreakdown', () => {
  it('should split pools TVL into the token side and the paired side', () => {
    expect(getTokenTvlBreakdown({ tvl: 55_432, poolsTvl: 112_821 })).toEqual({
      tokenTvl: 55_432,
      pairedTvl: 57_389,
      poolsTvl: 112_821,
    })
  })

  it('should return undefined when either TVL is missing', () => {
    expect(getTokenTvlBreakdown({ tvl: undefined, poolsTvl: 100 })).toBeUndefined()
    expect(getTokenTvlBreakdown({ tvl: 100, poolsTvl: undefined })).toBeUndefined()
  })

  it('should return undefined when pools TVL is below token TVL', () => {
    expect(getTokenTvlBreakdown({ tvl: 28_608_745, poolsTvl: 21_281_489 })).toBeUndefined()
    expect(getTokenTvlBreakdown({ tvl: 100, poolsTvl: 0 })).toBeUndefined()
  })

  it('should allow pools TVL equal to token TVL', () => {
    expect(getTokenTvlBreakdown({ tvl: 100, poolsTvl: 100 })).toEqual({ tokenTvl: 100, pairedTvl: 0, poolsTvl: 100 })
  })
})

describe('computeTokenMarketStats', () => {
  it('should resolve price from currentPrice then market', () => {
    // With only currentPrice and no 52w data, high52w/low52w stay undefined
    const no52w = computeTokenMarketStats({
      currentPrice: 1,
      market: { priceUsd: 3 },
    })
    expect(no52w.high52w).toBeUndefined()
    expect(no52w.low52w).toBeUndefined()

    const withOverride = computeTokenMarketStats({
      currentPrice: 10,
      market: { priceUsd: 2, priceHigh52wUsd: 5, priceLow52wUsd: 1 },
    })
    expect(withOverride.high52w).toBe(10)
    expect(withOverride.low52w).toBe(1)

    const fromMarket = computeTokenMarketStats({
      market: { priceUsd: 9, priceHigh52wUsd: 11, priceLow52wUsd: 5 },
    })
    expect(fromMarket.high52w).toBe(11)
    expect(fromMarket.low52w).toBe(5)
  })

  it('should resolve marketCap, fdv, tvl and poolsTvl from market', () => {
    const result = computeTokenMarketStats({
      market: {
        marketCapUsd: 1_000_000,
        fullyDilutedValuationUsd: 2_000_000,
        totalValueLockedUsd: 3_000_000,
        poolsTotalValueLockedUsd: 5_000_000,
      },
    })
    expect(result.marketCap).toBe(1_000_000)
    expect(result.fdv).toBe(2_000_000)
    expect(result.tvl).toBe(3_000_000)
    expect(result.poolsTvl).toBe(5_000_000)
  })

  it('should resolve volume from volumeUsd', () => {
    expect(computeTokenMarketStats({ market: { volumeUsd: 100 } }).volume).toBe(100)
    expect(computeTokenMarketStats({ market: {} }).volume).toBeUndefined()
  })

  it('should use market 52w for raw high/low before clamping', () => {
    const result = computeTokenMarketStats({
      currentPrice: 50,
      market: { priceHigh52wUsd: 70, priceLow52wUsd: 30 },
    })
    expect(result.high52w).toBe(70)
    expect(result.low52w).toBe(30)
  })

  it('should clamp 52w high to at least current price and low to at most current price', () => {
    const result = computeTokenMarketStats({
      currentPrice: 55,
      market: { priceHigh52wUsd: 50, priceLow52wUsd: 60 },
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
      tvl: undefined,
      poolsTvl: undefined,
    })
  })
})
