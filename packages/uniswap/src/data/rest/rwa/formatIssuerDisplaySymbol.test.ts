import { formatIssuerDisplaySymbol, formatIssuerLabel } from 'uniswap/src/data/rest/rwa/formatIssuerDisplaySymbol'

describe('formatIssuerDisplaySymbol', () => {
  it('uses the API symbol for issuer tokens', () => {
    expect(formatIssuerDisplaySymbol({ baseSymbol: 'TSLA', apiSymbol: 'TSLAON' })).toBe('TSLAON')
  })

  it('uses the API symbol instead of composing issuer suffixes', () => {
    expect(formatIssuerDisplaySymbol({ baseSymbol: 'TSLA', apiSymbol: 'BTSLA' })).toBe('BTSLA')
  })

  it('falls back to base symbol when API symbol is absent', () =>
    expect(formatIssuerDisplaySymbol({ baseSymbol: 'TSLA' })).toBe('TSLA'))
})

describe('formatIssuerLabel', () => {
  it('capitalizes issuer slug', () => {
    expect(formatIssuerLabel('ondo')).toBe('Ondo')
  })

  it('uses issuer-specific display casing', () => {
    expect(formatIssuerLabel('xstocks')).toBe('xStocks')
  })
})
