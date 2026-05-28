import { addGwei, gweiToWei, weiToGwei } from 'uniswap/src/features/gas/components/NetworkCostEditor/gweiToWei'

describe('gweiToWei', () => {
  it('converts integer GWEI', () => {
    expect(gweiToWei('5')).toBe('5000000000')
  })

  it('converts fractional GWEI', () => {
    expect(gweiToWei('3.21')).toBe('3210000000')
  })

  it('strips commas', () => {
    expect(gweiToWei('1,234')).toBe('1234000000000')
  })

  it('returns undefined on empty or non-numeric', () => {
    expect(gweiToWei('')).toBeUndefined()
    expect(gweiToWei('abc')).toBeUndefined()
    expect(gweiToWei(undefined)).toBeUndefined()
  })
})

describe('weiToGwei', () => {
  it('converts whole GWEI to an integer string', () => {
    expect(weiToGwei('1000000000')).toBe('1')
    expect(weiToGwei('5000000000')).toBe('5')
  })

  it('preserves sub-GWEI precision (does not truncate to 0)', () => {
    // Real values from a live /swap response — max base fee = 169820970 wei.
    expect(weiToGwei('169820970')).toBe('0.16982097')
    // Real values from a live /EstimateGasFee response.
    expect(weiToGwei('283028660')).toBe('0.28302866')
    expect(weiToGwei('142809654')).toBe('0.142809654')
  })

  it('accepts bigint and string inputs interchangeably', () => {
    expect(weiToGwei(BigInt('3210000000'))).toBe('3.21')
    expect(weiToGwei('3210000000')).toBe('3.21')
  })

  it('handles zero', () => {
    expect(weiToGwei('0')).toBe('0')
  })
})

describe('addGwei', () => {
  it('sums two GWEI strings', () => {
    expect(addGwei('3.21', '2')).toBe('5.21')
  })

  it('returns the non-empty operand when one is missing', () => {
    expect(addGwei('3.21', undefined)).toBe('3.21')
    expect(addGwei(undefined, '2')).toBe('2')
  })

  it('returns undefined when both missing', () => {
    expect(addGwei(undefined, undefined)).toBeUndefined()
  })
})
