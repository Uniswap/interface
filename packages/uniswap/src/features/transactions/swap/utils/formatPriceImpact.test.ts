import { Percent } from '@uniswap/sdk-core'
import { formatPriceImpact } from 'uniswap/src/features/transactions/swap/utils/formatPriceImpact'

describe('formatPriceImpact', () => {
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

  it('should format a positive price impact as unsigned', () => {
    const priceImpact = createPercent(5, 100)

    const result = formatPriceImpact(priceImpact, mockFormatPercent)

    expect(mockFormatPercent).toHaveBeenCalledWith(priceImpact.toFixed(3))
    expect(result).toBe(`${priceImpact.toFixed(3)}-mocked%`)
    expect(result?.startsWith('+')).toBe(false)
    expect(result?.startsWith('-')).toBe(false)
  })

  it('should format a negative price impact as unsigned', () => {
    const priceImpact = createPercent(-25, 1000) // -2.5%

    const result = formatPriceImpact(priceImpact, mockFormatPercent)

    expect(mockFormatPercent).toHaveBeenCalledWith(priceImpact.multiply(-1).toFixed(3))
    expect(result).toBe(`${priceImpact.multiply(-1).toFixed(3)}-mocked%`)
    expect(result?.startsWith('+')).toBe(false)
    expect(result?.startsWith('-')).toBe(false)
  })

  it('should format a zero price impact', () => {
    const priceImpact = createPercent(0, 100)

    const result = formatPriceImpact(priceImpact, mockFormatPercent)

    expect(mockFormatPercent).toHaveBeenCalledWith(priceImpact.toFixed(3))
    expect(result).toBe(`${priceImpact.toFixed(3)}-mocked%`)
    expect(result?.startsWith('+')).toBe(false)
    expect(result?.startsWith('-')).toBe(false)
  })
})
