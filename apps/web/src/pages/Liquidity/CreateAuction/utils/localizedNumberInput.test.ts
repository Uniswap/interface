import { describe, expect, it } from 'vitest'
import { formatLocalizedNumber } from '~/pages/Liquidity/CreateAuction/utils/localizedNumberInput'

describe('formatLocalizedNumber', () => {
  const locale = 'en-US'

  it('caps fractional digits to maxDecimals for ordinary values', () => {
    expect(formatLocalizedNumber({ rawValue: '0.123456', locale, maxDecimals: 4 })).toBe('0.1234')
  })

  it('trims trailing zeros when capping a longer fraction', () => {
    expect(formatLocalizedNumber({ rawValue: '0.50000', locale, maxDecimals: 4 })).toBe('0.5')
  })

  it('groups the integer part with locale separators', () => {
    expect(formatLocalizedNumber({ rawValue: '1234567.5', locale, maxDecimals: 4 })).toBe('1,234,567.5')
  })

  it('keeps an exact zero as "0"', () => {
    expect(formatLocalizedNumber({ rawValue: '0', locale, maxDecimals: 4 })).toBe('0')
  })

  // Regression: a valid, small deposit must not render as a misleading "0" when its first
  // significant digit falls beyond maxDecimals.
  it('does not collapse a small non-zero value to "0"', () => {
    expect(formatLocalizedNumber({ rawValue: '0.000000000000001', locale, maxDecimals: 4 })).toBe('0.000000000000001')
  })

  it('surfaces the first significant digits of a sub-cap value', () => {
    expect(formatLocalizedNumber({ rawValue: '0.00005', locale, maxDecimals: 4 })).toBe('0.00005')
  })

  // A value with a non-zero integer part already reads as non-zero, so the short-line cap stays.
  it('keeps the short cap when the integer part is already significant', () => {
    expect(formatLocalizedNumber({ rawValue: '10.000000001', locale, maxDecimals: 4 })).toBe('10')
  })
})
