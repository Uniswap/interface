import { parseFiniteNumber } from 'utilities/src/primitives/number'

describe(parseFiniteNumber, () => {
  it('parses decimal strings', () => {
    expect(parseFiniteNumber('1234567.89')).toBe(1234567.89)
    expect(parseFiniteNumber('0')).toBe(0)
    expect(parseFiniteNumber('-12.5')).toBe(-12.5)
  })

  it('returns undefined for missing, empty, or non-numeric input', () => {
    expect(parseFiniteNumber(undefined)).toBeUndefined()
    expect(parseFiniteNumber('')).toBeUndefined()
    expect(parseFiniteNumber('abc')).toBeUndefined()
    expect(parseFiniteNumber('Infinity')).toBeUndefined()
  })
})
