import { getIssuerTokenPrimaryName } from 'uniswap/src/features/rwa/getIssuerTokenPrimaryName'

describe('getIssuerTokenPrimaryName', () => {
  it('shows the token name when plainTokenNames is on', () => {
    expect(getIssuerTokenPrimaryName({ tokenName: 'Tesla (Ondo)', fallbackName: 'Tesla', plainTokenNames: true })).toBe(
      'Tesla (Ondo)',
    )
  })

  it('falls back to the asset name for an empty token name', () => {
    expect(getIssuerTokenPrimaryName({ tokenName: '', fallbackName: 'Tesla', plainTokenNames: true })).toBe('Tesla')
  })

  it('keeps the asset name when plainTokenNames is off', () => {
    expect(
      getIssuerTokenPrimaryName({ tokenName: 'Tesla (Ondo)', fallbackName: 'Tesla', plainTokenNames: false }),
    ).toBe('Tesla')
  })
})
