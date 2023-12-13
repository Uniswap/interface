import { Percent } from '@uniswap/sdk-core'
import { formatPriceImpact } from './formatPriceImpact'

describe('formatPriceImpact', () => {
  it('returns negative price impact value formatted as percentage for positive values', () => {
    expect(formatPriceImpact(new Percent(1))).toBe('-100.000%')
    expect(formatPriceImpact(new Percent(1, 2))).toBe('-50.000%')
    expect(formatPriceImpact(new Percent(2, 3))).toBe('-66.667%')
  })

  it('returns positive price impact value formatted as percentage for negative values', () => {
    expect(formatPriceImpact(new Percent(-1))).toBe('100.000%')
    expect(formatPriceImpact(new Percent(-1, 2))).toBe('50.000%')
    expect(formatPriceImpact(new Percent(-2, 3))).toBe('66.667%')
  })
})
