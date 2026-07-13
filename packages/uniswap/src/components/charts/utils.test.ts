import { getLowVarianceAxisDecimals } from 'uniswap/src/components/charts/utils'

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
