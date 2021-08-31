import { MKR, SKL, WETH } from '../constants/contracts'

describe('Remove Liquidity', () => {
  it('eth remove', () => {
    cy.visit(`/remove/v2/ETH/${MKR}`)
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'ETH')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'MKR')
  })

  it('eth remove swap order', () => {
    cy.visit(`/remove/v2/${MKR}/ETH`)
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'MKR')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'ETH')
  })

  it('loads the two correct tokens', () => {
    cy.visit(`/remove/v2/${WETH}/${MKR}`)
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'WETH')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'MKR')
  })

  it('does not crash if WETH is duplicated', () => {
    cy.visit(`/remove/v2/${WETH}/${WETH}`)
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'WETH')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'WETH')
  })

  it('token not in storage is loaded', () => {
    cy.visit(`/remove/v2/${SKL}/${MKR}`)
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'SKL')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'MKR')
  })
})
