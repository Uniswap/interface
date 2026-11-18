import { describe, expect, it } from 'vitest'
import { getUsableTickBounds } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/tickUtils'
import {
  getPriceRangeSummary,
  getRangeEdgeMoves,
  getTimeInRange,
  getMovePercentDecimals,
  roundMovePercent,
  withMoveSign,
} from '~/pages/PoolDetails/components/LiquidityPanel/priceRangeSummary'

// ~2.4% in price: 1.0001^240 ≈ 1.0243
const TICKS_2_4_PERCENT = 240

describe('getRangeEdgeMoves', () => {
  it('measures each edge from the current tick', () => {
    const { lower, upper } = getRangeEdgeMoves({
      tickLower: -TICKS_2_4_PERCENT,
      tickUpper: TICKS_2_4_PERCENT,
      tickCurrent: 0,
      priceInverted: false,
    })
    expect(upper).toBeCloseTo(0.0243, 4)
    expect(lower).toBeCloseTo(-0.0237, 4)
  })

  it('swaps and reciprocates the edges when the price is inverted', () => {
    // 1.0001^-500 - 1 and 1.0001^100 - 1
    const inverted = getRangeEdgeMoves({ tickLower: -100, tickUpper: 500, tickCurrent: 0, priceInverted: true })
    expect(inverted.lower).toBeCloseTo(-0.048768, 6)
    expect(inverted.upper).toBeCloseTo(0.01005, 6)
  })
})

describe('getPriceRangeSummary', () => {
  const base = { tickCurrent: 1000, tickSpacing: 10, priceInverted: false, fullRange: false }

  it('reads an edge at a usable tick as open', () => {
    const usable = getUsableTickBounds(10)
    expect(getPriceRangeSummary({ ...base, tickLower: 1010, tickUpper: usable.maxTick })).toEqual({
      kind: 'asymmetric',
      lowerPercent: expect.closeTo(0.1, 3),
      upperPercent: Infinity,
    })
    expect(getPriceRangeSummary({ ...base, tickLower: usable.minTick, tickUpper: 990 })).toEqual({
      kind: 'asymmetric',
      lowerPercent: -100,
      upperPercent: expect.closeTo(-0.1, 3),
    })
    // Inverted, the open top edge becomes the bottom one.
    expect(getPriceRangeSummary({ ...base, priceInverted: true, tickLower: 1010, tickUpper: usable.maxTick })).toEqual({
      kind: 'asymmetric',
      lowerPercent: -100,
      upperPercent: expect.closeTo(-0.1, 3),
    })
  })

  it('reads a full range as full', () => {
    expect(getPriceRangeSummary({ ...base, fullRange: true })).toEqual({ kind: 'full' })
  })

  it('reads a ratio-symmetric range as ± its larger edge', () => {
    const summary = getPriceRangeSummary({
      ...base,
      tickLower: 1000 - TICKS_2_4_PERCENT,
      tickUpper: 1000 + TICKS_2_4_PERCENT,
    })
    expect(summary?.kind).toBe('symmetric')
    expect(summary?.kind === 'symmetric' && summary.percent).toBeCloseTo(2.43, 2)
  })

  it('tolerates a one-spacing offset from snapping', () => {
    const summary = getPriceRangeSummary({ ...base, tickLower: 1000 - 240, tickUpper: 1000 + 250 })
    expect(summary?.kind).toBe('symmetric')
  })

  it('reads a range a few ticks off center as symmetric on a fine tick spacing', () => {
    // tick spacing 1: centered on the latest price, 8 ticks from the pool's tick
    const summary = getPriceRangeSummary({ ...base, tickSpacing: 1, tickLower: 1000 - 782, tickUpper: 1000 + 798 })
    expect(summary?.kind).toBe('symmetric')
  })

  it('reports each edge of the wide preset rather than ± its larger one', () => {
    // −50% / +100%: centred in ratio terms, but not "± 100%"
    const summary = getPriceRangeSummary({ ...base, tickLower: 1000 - 6930, tickUpper: 1000 + 6930 })
    expect(summary?.kind).toBe('asymmetric')
  })

  it('reports each edge for a lopsided range', () => {
    const summary = getPriceRangeSummary({ ...base, tickLower: 1000 - 100, tickUpper: 1000 + 1000 })
    expect(summary?.kind).toBe('asymmetric')
    if (summary?.kind === 'asymmetric') {
      expect(summary.lowerPercent).toBeLessThan(0)
      expect(summary.upperPercent).toBeGreaterThan(10)
    }
  })

  it('is undefined until the range and pool are known', () => {
    expect(getPriceRangeSummary({ ...base, tickLower: undefined, tickUpper: 10 })).toBeUndefined()
    expect(getPriceRangeSummary({ ...base, tickLower: 0, tickUpper: 10, tickCurrent: undefined })).toBeUndefined()
  })
})

describe('getTimeInRange', () => {
  it('counts the share of prices inside the range relative to the current price', () => {
    expect(
      getTimeInRange({ historicalPrices: [100, 101, 103, 97, 99], currentPrice: 100, lower: -0.02, upper: 0.02 }),
    ).toBe(0.6)
  })

  it('counts a price exactly on an edge as in range', () => {
    expect(getTimeInRange({ historicalPrices: [98, 102], currentPrice: 100, lower: -0.02, upper: 0.02 })).toBe(1)
  })

  it('is undefined without history', () => {
    expect(getTimeInRange({ historicalPrices: [], currentPrice: 100, lower: -0.02, upper: 0.02 })).toBeUndefined()
  })
})

describe('getMovePercentDecimals', () => {
  it('shows fewer decimals the larger the move', () => {
    expect(getMovePercentDecimals(100)).toBeUndefined()
    expect(getMovePercentDecimals(-7.6)).toBe(1)
    expect(getMovePercentDecimals(0.03)).toBe(2)
  })
})

describe('roundMovePercent', () => {
  it('keeps more precision the smaller the move', () => {
    expect(roundMovePercent(100.04)).toBe(100)
    expect(roundMovePercent(-50.4)).toBe(-50)
    expect(roundMovePercent(7.734)).toBe(7.7)
    expect(roundMovePercent(0.0312)).toBe(0.03)
  })
})

describe('withMoveSign', () => {
  it('prefixes a rise with + and leaves a fall or no move as formatted', () => {
    expect(withMoveSign('12%', 12)).toBe('+12%')
    expect(withMoveSign('-7.2%', -7.2)).toBe('-7.2%')
    expect(withMoveSign('0%', 0)).toBe('0%')
  })
})
