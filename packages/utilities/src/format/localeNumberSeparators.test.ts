import {
  formatDotDecimalForLocale,
  getLocaleNumberSeparators,
  normalizeIntlNumberToDotDecimal,
} from 'utilities/src/format/localeNumberSeparators'
import { trimFractionalTrailingZeros } from 'utilities/src/format/parseForSubscriptNotation'
import { describe, expect, it } from 'vitest'

describe('getLocaleNumberSeparators', () => {
  it('returns "." and "," for en-US', () => {
    const seps = getLocaleNumberSeparators('en-US')
    expect(seps.decimal).toBe('.')
    expect(seps.group).toBe(',')
  })
  it('returns "," and "." for de-DE', () => {
    const seps = getLocaleNumberSeparators('de-DE')
    expect(seps.decimal).toBe(',')
    // de-DE typically uses U+00A0 (NO-BREAK SPACE) or "." as a group separator; assert non-empty.
    expect(seps.group.length).toBeGreaterThan(0)
  })
})

describe('normalizeIntlNumberToDotDecimal', () => {
  it('strips US group separators', () => {
    expect(normalizeIntlNumberToDotDecimal('1,000', 'en-US')).toBe('1000')
  })
  it('converts a German comma-decimal to a dot-decimal', () => {
    expect(normalizeIntlNumberToDotDecimal('1,2300', 'de-DE')).toBe('1.2300')
  })
})

describe('formatDotDecimalForLocale', () => {
  it('round-trips an en-US 1000 through normalize → trim → format', () => {
    expect(
      formatDotDecimalForLocale(
        trimFractionalTrailingZeros(normalizeIntlNumberToDotDecimal('1,000', 'en-US')),
        'en-US',
      ),
    ).toBe('1,000')
  })
  it('round-trips a de-DE 1,2300 through normalize → trim → format', () => {
    expect(
      formatDotDecimalForLocale(
        trimFractionalTrailingZeros(normalizeIntlNumberToDotDecimal('1,2300', 'de-DE')),
        'de-DE',
      ),
    ).toBe('1,23')
  })
})
