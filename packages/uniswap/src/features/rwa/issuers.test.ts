import { getRWAIssuerDisplayName, getRWAIssuerLabel } from 'uniswap/src/features/rwa/issuers'
import { UNKNOWN_RWA_ISSUER } from 'uniswap/src/features/rwa/types'

describe(getRWAIssuerDisplayName, () => {
  it('capitalizes the slug', () => {
    expect(getRWAIssuerDisplayName('ondo')).toBe('Ondo')
    expect(getRWAIssuerDisplayName('')).toBe('')
  })
})

describe(getRWAIssuerLabel, () => {
  it('prefers the backend display name over the slug', () => {
    expect(getRWAIssuerLabel({ issuer: 'xstocks', issuerDisplayName: 'xStocks (Backed Finance)' })).toBe(
      'xStocks (Backed Finance)',
    )
  })

  it('falls back to the capitalized slug', () => {
    expect(getRWAIssuerLabel({ issuer: 'xstocks' })).toBe('Xstocks')
  })

  it('hides the unknown-issuer sentinel', () => {
    expect(getRWAIssuerLabel({ issuer: UNKNOWN_RWA_ISSUER })).toBeUndefined()
    expect(getRWAIssuerLabel({ issuer: UNKNOWN_RWA_ISSUER, issuerDisplayName: 'Tether' })).toBe('Tether')
  })
})
