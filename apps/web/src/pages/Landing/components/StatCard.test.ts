import { getSpriteCharset } from '~/pages/Landing/components/StatCard'

describe('getSpriteCharset', () => {
  it('groups digits into the shared numeric charset', () => {
    expect(getSpriteCharset('4')).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
  })

  it('groups decimal/thousands separators into the shared delineator charset', () => {
    expect(getSpriteCharset('.')).toEqual([',', '.'])
    expect(getSpriteCharset(',')).toEqual([',', '.'])
  })

  it('groups known single-char currency symbols into the shared currency charset', () => {
    expect(getSpriteCharset('$')).toEqual(['¥', '£', '€', '$'])
  })

  it('groups shorthand suffix letters into the shared suffix charset', () => {
    expect(getSpriteCharset('T')).toEqual([' ', 'K', 'M', 'B', 'T'])
    expect(getSpriteCharset('K')).toEqual([' ', 'K', 'M', 'B', 'T'])
  })

  // Regression coverage for CONS-3499: "HK$31.4T" (English + HKD currency) rendered as "K$31.4T"
  // because "H" fell through to the suffix charset, was never found there, and every sprite frame
  // rendered at opacity 0. It must instead fall back to its own single-char charset so it renders.
  it('falls back to a single-char charset for a multi-char currency symbol like the "H" in "HK$"', () => {
    expect(getSpriteCharset('H')).toEqual(['H'])
  })

  // Regression coverage for CONS-3499: Chinese (zh) locale compact notation renders values like
  // "US$4.0万亿" and "US$29.4亿" — the CJK unit characters (and the "U"/"S" of "US$") fell through
  // to the suffix charset, were never found there, and vanished, leaving "$4.0" / "$29.4".
  it('falls back to a single-char charset for CJK compact-notation units', () => {
    expect(getSpriteCharset('万')).toEqual(['万'])
    expect(getSpriteCharset('亿')).toEqual(['亿'])
  })

  it('falls back to a single-char charset for other unrecognized letters (e.g. a locale-specific currency prefix)', () => {
    expect(getSpriteCharset('U')).toEqual(['U'])
    expect(getSpriteCharset('S')).toEqual(['S'])
  })
})
