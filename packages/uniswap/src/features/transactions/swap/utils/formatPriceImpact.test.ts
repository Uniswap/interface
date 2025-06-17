import { Percent } from '@uniswap/sdk-core'
import { formatPriceImpact } from 'uniswap/src/features/transactions/swap/utils/formatPriceImpact'

describe('formatPriceImpact', () => {
  // Accepts Maybe<string | number> and returns string
  const mockFormatPercent = jest.fn((value: Maybe<string | number>): string => {
    if (value === undefined || value === null) {
      return '-mocked%'
    }
    return `${value}-mocked%`
  })

  const createPercent = (numerator: number, denominator: number = 100): Percent => {
    // Dynamically import Percent to avoid dependency issues in test environments

    return new Percent(numerator, denominator)
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should format a positive price impact (negative effect for user)', () => {
    // Arrange: 5% price impact
    const priceImpact = createPercent(5, 100)

    // Act
    const result = formatPriceImpact(priceImpact, mockFormatPercent)

    // Assert
    // Should multiply by -1 and not add a + prefix
    expect(mockFormatPercent).toHaveBeenCalledWith(priceImpact.multiply(-1).toFixed(3))
    expect(result).toBe(`${priceImpact.multiply(-1).toFixed(3)}-mocked%`)
    expect(result?.startsWith('+')).toBe(false)
  })

  it('should format a negative price impact (positive effect for user) and add a + prefix', () => {
    // Arrange: -2.5% price impact
    const priceImpact = createPercent(-25, 1000) // -2.5%

    // Act
    const result = formatPriceImpact(priceImpact, mockFormatPercent)

    // Assert
    // Should multiply by -1 and add a + prefix
    expect(mockFormatPercent).toHaveBeenCalledWith(priceImpact.multiply(-1).toFixed(3))
    expect(result).toBe(`+${priceImpact.multiply(-1).toFixed(3)}-mocked%`)
  })

  it('should format a zero price impact', () => {
    // Arrange: 0% price impact
    const priceImpact = createPercent(0, 100)

    // Act
    const result = formatPriceImpact(priceImpact, mockFormatPercent)

    // Assert
    expect(mockFormatPercent).toHaveBeenCalledWith(priceImpact.multiply(-1).toFixed(3))
    expect(result).toBe(`${priceImpact.multiply(-1).toFixed(3)}-mocked%`)
    expect(result?.startsWith('+')).toBe(false)
  })

  it('should handle small decimal price impacts', () => {
    // Arrange: 0.123% price impact
    const priceImpact = createPercent(123, 100000)

    // Act
    const result = formatPriceImpact(priceImpact, mockFormatPercent)

    // Assert
    expect(mockFormatPercent).toHaveBeenCalledWith(priceImpact.multiply(-1).toFixed(3))
    expect(result).toBe(`${priceImpact.multiply(-1).toFixed(3)}-mocked%`)
  })

  it('should handle large negative price impacts (large positive for user)', () => {
    // Arrange: -100% price impact
    const priceImpact = createPercent(-1, 1)

    // Act
    const result = formatPriceImpact(priceImpact, mockFormatPercent)

    // Assert
    expect(mockFormatPercent).toHaveBeenCalledWith(priceImpact.multiply(-1).toFixed(3))
    expect(result).toBe(`+${priceImpact.multiply(-1).toFixed(3)}-mocked%`)
  })
})
