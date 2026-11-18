import { getIssuerTokenPrimaryName } from 'uniswap/src/features/rwa/getIssuerTokenPrimaryName'

describe('getIssuerTokenPrimaryName', () => {
  it('shows the token name', () => {
    expect(getIssuerTokenPrimaryName({ tokenName: 'Tesla (Ondo)', fallbackName: 'Tesla' })).toBe('Tesla (Ondo)')
  })

  it('falls back to the asset name for an empty token name', () => {
    expect(getIssuerTokenPrimaryName({ tokenName: '', fallbackName: 'Tesla' })).toBe('Tesla')
  })
})
