import { Percent } from '@uniswap/sdk-core'
import { normalizePriceImpact } from './normalizePriceImpact'

describe('normalizePriceImpact', () => {
  it('returns negative price impact value as percentage for positive values', () => {
    expect(normalizePriceImpact(new Percent(1))).toBe(-100)
    expect(normalizePriceImpact(new Percent(1, 2))).toBe(-50)
    expect(normalizePriceImpact(new Percent(1, 8))).toBe(-12.5)
    expect(normalizePriceImpact(new Percent(2, 3))).toBe(-66.667)
  })

  it('returns positive price impact value as percentage for negative values', () => {
    expect(normalizePriceImpact(new Percent(-1))).toBe(100)
    expect(normalizePriceImpact(new Percent(-1, 2))).toBe(50)
    expect(normalizePriceImpact(new Percent(-1, 8))).toBe(12.5)
    expect(normalizePriceImpact(new Percent(-2, 3))).toBe(66.667)
  })
})
