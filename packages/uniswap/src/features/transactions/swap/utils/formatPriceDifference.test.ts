import { Percent } from '@uniswap/sdk-core'
import { formatPriceDifference } from 'uniswap/src/features/transactions/swap/utils/formatPriceDifference'

describe('formatPriceDifference', () => {
  // Accepts Maybe<string | number> and returns string
  const mockFormatPercent = vi.fn((value: Maybe<string | number>): string => {
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
    vi.clearAllMocks()
  })

  it('should format a positive price difference as unsigned', () => {
    const priceDifference = createPercent(5, 100)

    const result = formatPriceDifference(priceDifference, mockFormatPercent)

    expect(mockFormatPercent).toHaveBeenCalledWith(priceDifference.toFixed(3))
    expect(result).toBe(`${priceDifference.toFixed(3)}-mocked%`)
    expect(result?.startsWith('+')).toBe(false)
    expect(result?.startsWith('-')).toBe(false)
  })

  it('should format a negative price difference as unsigned', () => {
    const priceDifference = createPercent(-25, 1000) // -2.5%

    const result = formatPriceDifference(priceDifference, mockFormatPercent)

    expect(mockFormatPercent).toHaveBeenCalledWith(priceDifference.multiply(-1).toFixed(3))
    expect(result).toBe(`${priceDifference.multiply(-1).toFixed(3)}-mocked%`)
    expect(result?.startsWith('+')).toBe(false)
    expect(result?.startsWith('-')).toBe(false)
  })

  it('should format a zero price difference', () => {
    const priceDifference = createPercent(0, 100)

    const result = formatPriceDifference(priceDifference, mockFormatPercent)

    expect(mockFormatPercent).toHaveBeenCalledWith(priceDifference.toFixed(3))
    expect(result).toBe(`${priceDifference.toFixed(3)}-mocked%`)
    expect(result?.startsWith('+')).toBe(false)
    expect(result?.startsWith('-')).toBe(false)
  })
})
