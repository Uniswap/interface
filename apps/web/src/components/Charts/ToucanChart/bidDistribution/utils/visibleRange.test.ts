import {
  calculateRangePaddingUnits,
  constrainVisibleRangeToBounds,
} from '~/components/Charts/ToucanChart/bidDistribution/utils/visibleRange'

describe('calculateRangePaddingUnits', () => {
  it('should return at least 1', () => {
    expect(calculateRangePaddingUnits({ priceScaleFactor: 0 })).toBe(1)
    expect(calculateRangePaddingUnits({ priceScaleFactor: 1 })).toBe(1)
  })

  it('should scale roughly linearly with priceScaleFactor', () => {
    expect(calculateRangePaddingUnits({ priceScaleFactor: 10_000 })).toBe(25)
    expect(calculateRangePaddingUnits({ priceScaleFactor: 20_000 })).toBe(50)
  })
})

describe('constrainVisibleRangeToBounds', () => {
  it('should not correct when within bounds', () => {
    const result = constrainVisibleRangeToBounds({ currentFrom: 10, currentTo: 20, fullFrom: 0, fullTo: 30 })
    expect(result.corrected).toBe(false)
    expect(result.from).toBe(10)
    expect(result.to).toBe(20)
  })

  it('should correct when range is below fullFrom', () => {
    const result = constrainVisibleRangeToBounds({ currentFrom: -10, currentTo: 10, fullFrom: 0, fullTo: 30 })
    expect(result.corrected).toBe(true)
    expect(result.from).toBe(0)
    expect(result.to).toBe(20)
  })

  it('should correct when range is above fullTo', () => {
    const result = constrainVisibleRangeToBounds({ currentFrom: 25, currentTo: 45, fullFrom: 0, fullTo: 30 })
    expect(result.corrected).toBe(true)
    expect(result.to).toBe(30)
  })
})
