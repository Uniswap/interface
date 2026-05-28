import { trimFractionalTrailingZeros } from 'utilities/src/format/parseForSubscriptNotation'
import { describe, expect, it } from 'vitest'

describe('trimFractionalTrailingZeros', () => {
  it('strips a single trailing zero', () => {
    expect(trimFractionalTrailingZeros('0.0010')).toBe('0.001')
  })
  it('strips multiple trailing zeros', () => {
    expect(trimFractionalTrailingZeros('0.001000')).toBe('0.001')
  })
  it('returns integer when fractional part is all zeros', () => {
    expect(trimFractionalTrailingZeros('1.000')).toBe('1')
  })
  it('strips trailing zeros on a dot-decimal string regardless of locale separator', () => {
    expect(trimFractionalTrailingZeros('1.2300')).toBe('1.23')
  })
  it('returns scientific notation unchanged', () => {
    expect(trimFractionalTrailingZeros('1.5e-10')).toBe('1.5e-10')
  })
  it('returns compact K suffix unchanged', () => {
    expect(trimFractionalTrailingZeros('1.5K')).toBe('1.5K')
  })
  it('returns compact M suffix unchanged', () => {
    expect(trimFractionalTrailingZeros('2.30M')).toBe('2.30M')
  })
  it('returns an integer-only string unchanged', () => {
    expect(trimFractionalTrailingZeros('1000')).toBe('1000')
  })
  it('reduces "0.000" to "0"', () => {
    expect(trimFractionalTrailingZeros('0.000')).toBe('0')
  })
  it('leaves a comma-separated locale string untouched (caller must normalize first)', () => {
    expect(trimFractionalTrailingZeros('1,2300')).toBe('1,2300')
  })
})
