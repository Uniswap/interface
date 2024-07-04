import { MaxUint256, UNI_ADDRESSES } from '@uniswap/sdk-core'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { UniverseChainId } from 'uniswap/src/types/chains'

const UNI_MAINNET = UNI_ADDRESSES[UniverseChainId.Mainnet]

describe('Remove Liquidity', () => {
  it('loads the token pair in v2', () => {
    cy.visit(`/remove/v2/ETH/${UNI_MAINNET}`, {
      featureFlags: [{ flag: FeatureFlags.V2Everywhere, value: true }],
    })
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'ETH')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'UNI')
  })

  it('loads the token pair in v3', () => {
    cy.visit(`/remove/1`)
    cy.get('#remove-liquidity-tokens').should('contain.text', 'UNI/ETH')

    cy.get('#remove-pooled-tokena-symbol').should('contain.text', 'Pooled UNI')
    cy.get('#remove-pooled-tokenb-symbol').should('contain.text', 'Pooled ETH')
  })

  it('should redirect to error pages if pool does not exist', () => {
    // Duplicate-token v2 pools redirect to position unavailable
    cy.visit(`/remove/v2/ETH/ETH`)
    cy.contains('Position unavailable')

    // Single-token pools don't exist
    cy.visit('/remove/v2/ETH')
    cy.url().should('match', /\/not-found/)

    // Nonexistent v3 pool
    cy.visit(`/remove/${MaxUint256}`)
    cy.contains('Position unavailable')
  })
})
