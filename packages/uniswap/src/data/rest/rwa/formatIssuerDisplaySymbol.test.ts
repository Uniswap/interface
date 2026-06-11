import { formatIssuerDisplaySymbol, formatIssuerLabel } from 'uniswap/src/data/rest/rwa/formatIssuerDisplaySymbol'

describe('formatIssuerDisplaySymbol', () => {
  it('composes ondo suffix', () => {
    expect(formatIssuerDisplaySymbol({ baseSymbol: 'TSLA', issuer: 'ondo', apiSymbol: 'TSLAON' })).toBe('TSLA.o')
  })

  it('falls back to api symbol for unknown issuers', () => {
    expect(formatIssuerDisplaySymbol({ baseSymbol: 'TSLA', issuer: 'unknown', apiSymbol: 'CUSTOM' })).toBe('CUSTOM')
  })
})

describe('formatIssuerLabel', () => {
  it('capitalizes issuer slug', () => {
    expect(formatIssuerLabel('ondo')).toBe('Ondo')
  })

  it('uses issuer-specific display casing', () => {
    expect(formatIssuerLabel('xstocks')).toBe('xStocks')
  })
})
