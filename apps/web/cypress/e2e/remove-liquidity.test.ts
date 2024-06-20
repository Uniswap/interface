import { ChainId, MaxUint256, UBE_ADDRESSES } from '@ubeswap/sdk-core'

const UBE_CELO = UBE_ADDRESSES[ChainId.CELO]

describe('Remove Liquidity', () => {
  it('loads the token pair in v2', () => {
    cy.visit(`/remove/v2/CELO/${UBE_CELO}`)
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'CELO')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'UBE')
  })

  it('loads the token pair in v3', () => {
    cy.visit(`/remove/1`)
    cy.get('#remove-liquidity-tokens').should('contain.text', 'UBE/CELO')

    cy.get('#remove-pooled-tokena-symbol').should('contain.text', 'Pooled UBE')
    cy.get('#remove-pooled-tokenb-symbol').should('contain.text', 'Pooled CELO')
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
