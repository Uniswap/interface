import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { mergeGasFeeResults, sumGasFees } from 'uniswap/src/features/transactions/swap/utils/gas'

describe('sumGasFees', () => {
  it('returns undefined for empty array', () => {
    const gasFees: string[] = []

    const result = sumGasFees(gasFees)

    expect(result).toBeUndefined()
  })

  it('returns same value for single gas fee', () => {
    const gasFees = ['1000']

    const result = sumGasFees(gasFees)

    expect(result).toBe('1000')
  })

  it('sums multiple gas fees correctly', () => {
    const gasFees = ['1000', '2000', '3000']

    const result = sumGasFees(gasFees)

    expect(result).toBe('6000')
  })

  it('handles undefined values by treating them as zero', () => {
    const gasFees = ['1000', undefined, '2000']

    const result = sumGasFees(gasFees)

    expect(result).toBe('3000')
  })

  it('handles large numbers without overflow', () => {
    const gasFees = ['999999999999999999999999', '999999999999999999999999']

    const result = sumGasFees(gasFees)

    expect(result).toBe('1999999999999999999999998')
  })
})

describe('mergeGasFeeResults', () => {
  const baseGasFeeResult: GasFeeResult = {
    value: '1000',
    displayValue: '1000',
    error: null,
    isLoading: false,
  }

  it('returns single gas fee result unchanged', () => {
    const gasFeeResults = [baseGasFeeResult]

    const result = mergeGasFeeResults(...gasFeeResults)

    expect(result).toEqual(baseGasFeeResult)
  })

  it('combines multiple gas fee results correctly', () => {
    const gasFeeResults: GasFeeResult[] = [
      { ...baseGasFeeResult, value: '1000', displayValue: '1000' },
      { ...baseGasFeeResult, value: '2000', displayValue: '2000' },
    ]

    const result = mergeGasFeeResults(...gasFeeResults)

    expect(result).toEqual({
      value: '3000',
      displayValue: '3000',
      error: null,
      isLoading: false,
    })
  })

  it('sets isLoading true if any result is loading', () => {
    const gasFeeResults: GasFeeResult[] = [{ ...baseGasFeeResult }, { ...baseGasFeeResult, isLoading: true }]

    const result = mergeGasFeeResults(...gasFeeResults)

    expect(result.isLoading).toBe(true)
  })

  it('returns first error encountered', () => {
    const error1 = new Error('First error')
    const error2 = new Error('Second error')
    const gasFeeResults: GasFeeResult[] = [
      { ...baseGasFeeResult, error: error1 },
      { ...baseGasFeeResult, error: error2 },
    ]

    const result = mergeGasFeeResults(...gasFeeResults)

    expect(result).toEqual({
      value: undefined,
      displayValue: undefined,
      error: error1,
      isLoading: false,
    })
  })

  it('returns undefined values when any value is missing', () => {
    const gasFeeResults: GasFeeResult[] = [
      { ...baseGasFeeResult, value: '1000', displayValue: '1000' },
      { ...baseGasFeeResult, value: undefined, displayValue: undefined },
    ]

    const result = mergeGasFeeResults(...gasFeeResults)

    expect(result).toEqual({
      value: undefined,
      displayValue: undefined,
      error: null,
      isLoading: false,
    })
  })

  it('handles empty array of results', () => {
    const gasFeeResults: GasFeeResult[] = []

    const result = mergeGasFeeResults(...gasFeeResults)

    expect(result).toEqual({
      value: undefined,
      displayValue: undefined,
      error: null,
      isLoading: false,
    })
  })

  it('maintains different display and actual values', () => {
    const gasFeeResults: GasFeeResult[] = [
      { ...baseGasFeeResult, value: '1000', displayValue: '2000' },
      { ...baseGasFeeResult, value: '3000', displayValue: '4000' },
    ]

    const result = mergeGasFeeResults(...gasFeeResults)

    expect(result).toEqual({
      value: '4000',
      displayValue: '6000',
      error: null,
      isLoading: false,
    })
  })
})
