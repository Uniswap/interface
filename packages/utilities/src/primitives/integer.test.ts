import { isNumeric, isSafeNumber } from 'utilities/src/primitives/integer'

describe(isSafeNumber, () => {
  it('returns true for a safe number', () => {
    expect(isSafeNumber(1)).toBe(true)
    expect(isSafeNumber('500.53')).toBe(true)

    expect(isSafeNumber(Number.MAX_SAFE_INTEGER)).toBe(true)
  })

  it('returns false for an unsafe number', () => {
    expect(isSafeNumber(Number.MAX_SAFE_INTEGER + 1)).toBe(false)

    // Test infinite value (overflows to Infinity)
    expect(isSafeNumber('1.0e1000')).toBe(false)
  })

  it('returns true for values that underflow to zero', () => {
    expect(isSafeNumber('1.0e-1000')).toBe(true)
  })
})

describe(isNumeric, () => {
  it('returns true for a numeric string', () => {
    expect(isNumeric('1')).toBe(true)
    expect(isNumeric('1.0e1000')).toBe(true)
    expect(isNumeric('1.0e-1000')).toBe(true)
    expect(isNumeric('  1.0e1000 ', true)).toBe(true)
  })

  it('returns true for an empty string', () => {
    expect(isNumeric('      ', true)).toBe(true)
  })

  it('returns false for a non-numeric string', () => {
    expect(isNumeric('xxxxxx')).toBe(false)
    expect(isNumeric('ff00ff')).toBe(false)
    expect(isNumeric('  x', true)).toBe(false)
  })
})
