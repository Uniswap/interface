import { calculatePriceScaleFactor } from '~/components/Charts/ToucanChart/bidDistribution/utils/priceScaleFactor'

describe('calculatePriceScaleFactor', () => {
  it('should return default factor when tickSizeDecimal is invalid', () => {
    expect(
      calculatePriceScaleFactor({
        tickSizeDecimal: 0,
        minTick: 0,
        maxTick: 1,
        clearingPriceDecimal: 1,
      }),
    ).toBe(10_000)
  })

  it('should return a factor >= default factor for reasonable tick sizes', () => {
    const factor = calculatePriceScaleFactor({
      tickSizeDecimal: 0.01,
      minTick: 0,
      maxTick: 10,
      clearingPriceDecimal: 5,
    })
    expect(factor).toBeGreaterThanOrEqual(10_000)
  })

  it('should clamp factor to avoid exceeding MAX_SAFE_INTEGER scaling', () => {
    const factor = calculatePriceScaleFactor({
      tickSizeDecimal: 1e-12,
      minTick: 0,
      maxTick: 1e15,
      clearingPriceDecimal: 1e15,
    })

    // Should still be finite and safe.
    expect(Number.isFinite(factor)).toBe(true)
    expect(factor).toBeGreaterThan(0)
  })
})
