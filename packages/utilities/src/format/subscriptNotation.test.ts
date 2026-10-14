import { getSubscriptNotationParts } from 'utilities/src/format/getSubscriptNotationParts'
import { formatNumberWithSubscript } from 'utilities/src/format/subscriptNotation'
import { describe, expect, it } from 'vitest'

describe('formatNumberWithSubscript', () => {
  it('returns "0" for zero', () => {
    expect(formatNumberWithSubscript({ value: 0, locale: 'en-US' })).toBe('0')
  })

  it('uses subscript notation when leading zeros >= threshold (default 4)', () => {
    // 0.000052 → 4 leading zeros after the decimal, sig digits "52" → "0.0₄52"
    expect(formatNumberWithSubscript({ value: 0.000052, locale: 'en-US' })).toBe('0.0₄52')
  })

  it('keeps up to 4 sig digits when present', () => {
    // 0.0000523 → 4 leading zeros, sig digits "523" → "0.0₄523"
    expect(formatNumberWithSubscript({ value: 0.0000523, locale: 'en-US' })).toBe('0.0₄523')
  })

  it('handles many leading zeros with multi-digit subscript', () => {
    // 1e-12 → 11 leading zeros, sig digits padded to min 2 → "0.0₁₁10"
    expect(formatNumberWithSubscript({ value: 1e-12, locale: 'en-US' })).toBe('0.0₁₁10')
  })

  it('handles values below the 20-decimal Number.toFixed default (adaptive precision)', () => {
    // 1e-23 → 22 leading zeros, sig digits padded to min 2 → "0.0₂₂10".
    // The default precision of 20 used to truncate this to all zeros, rendering
    // an empty significant part ("0.0₂₂"). The adaptive widening keeps the digit.
    expect(formatNumberWithSubscript({ value: 1e-23, locale: 'en-US' })).toBe('0.0₂₂10')
  })

  it('does not use subscript when leading zeros < threshold', () => {
    // 0.05 → 1 leading zero, no subscript; trailing Intl-padding zeros are trimmed
    expect(formatNumberWithSubscript({ value: 0.05, locale: 'en-US' })).toBe('0.05')
  })

  it('falls back to standard formatting for values >= 1', () => {
    expect(formatNumberWithSubscript({ value: 1.5, locale: 'en-US' })).toBe('1.5')
  })

  it('respects a custom subscriptThreshold', () => {
    // 0.005 → 2 leading zeros, threshold 2 → subscript with min 2 sig digits → "0.0₂50"
    expect(formatNumberWithSubscript({ value: 0.005, locale: 'en-US', subscriptThreshold: 2 })).toBe('0.0₂50')
  })

  it('respects locale decimal separator', () => {
    // es-ES uses comma as decimal separator
    expect(formatNumberWithSubscript({ value: 0.000052, locale: 'es-ES' })).toBe('0,0₄52')
  })

  it('handles negative values by formatting their absolute value', () => {
    // Chart y-axis values are non-negative in practice; this guards the path.
    expect(formatNumberWithSubscript({ value: -0.000052, locale: 'en-US' })).toBe('0.0₄52')
  })

  describe('floats one ulp below their decimal value (regression: toFixed truncation)', () => {
    // These floats stringify via toFixed(20) as e.g. "0.0000699999…"; slicing that raw
    // string truncated instead of rounding, corrupting the displayed digits.
    it('formats 0.00007 as 0.0₄70, not 0.0₄6999', () => {
      expect(formatNumberWithSubscript({ value: 0.00007, locale: 'en-US' })).toBe('0.0₄70')
    })
    it('formats 0.000099 as 0.0₄99, not 0.0₄9899', () => {
      expect(formatNumberWithSubscript({ value: 0.000099, locale: 'en-US' })).toBe('0.0₄99')
    })
    it('formats 0.000065 as 0.0₄65, not 0.0₄6499', () => {
      expect(formatNumberWithSubscript({ value: 0.000065, locale: 'en-US' })).toBe('0.0₄65')
    })
    it('formats 0.0000611 as 0.0₄611, not 0.0₄6109', () => {
      expect(formatNumberWithSubscript({ value: 0.0000611, locale: 'en-US' })).toBe('0.0₄611')
    })
    it('carries into the next magnitude: 0.00009994 rounds to plain 0.0001', () => {
      expect(formatNumberWithSubscript({ value: 0.00009994, locale: 'en-US' })).toBe('0.0001')
    })
  })
})

describe('getSubscriptNotationParts exponent carry', () => {
  it('drops below the threshold when rounding bumps the magnitude', () => {
    // 0.000099999 rounds to 1.000e-4 at 4 sig digits — 3 leading zeros, no subscript.
    expect(
      getSubscriptNotationParts({ value: 0.000099999, subscriptThreshold: 4, maxSigDigits: 4, minSigDigits: 2 }),
    ).toEqual({ usesSubscript: false, leadingZeros: 3, significantPart: '' })
  })
})
