import { BigNumber } from '@ethersproject/bignumber'
import { BigNumberMax, isZero, toStringish } from 'uniswap/src/utils/number'

describe(isZero, () => {
  it('identifies 0 on different types', () => {
    expect(isZero(0)).toBe(true)
    expect(isZero('0')).toBe(true)
    expect(isZero(BigNumber.from(0))).toBe(true)
  })

  it('identifies non-zero on different types', () => {
    expect(isZero(1)).toBe(false)
    expect(isZero('1')).toBe(false)
    expect(isZero(BigNumber.from(1))).toBe(false)
  })
})

describe(BigNumberMax, () => {
  it('returns the max of two numbers', () => {
    expect(BigNumberMax(BigNumber.from(1), BigNumber.from(2))).toEqual(BigNumber.from(2))
  })

  it('returns first value if numbers are equal', () => {
    expect(BigNumberMax(BigNumber.from(1), BigNumber.from(1))).toEqual(BigNumber.from(1))
  })
})

describe(toStringish, () => {
  it('handles undefined value', () => {
    expect(toStringish(undefined)).toBe(undefined)
  })

  it('returns a string if a number is passed', () => {
    expect(toStringish(1)).toBe('1')
  })

  it('returns a string if a string is passed', () => {
    expect(toStringish('1')).toBe('1')
  })

  it('returns a string if a BigNumber is passed', () => {
    expect(toStringish(BigNumber.from(1))).toBe('1')
  })
})
