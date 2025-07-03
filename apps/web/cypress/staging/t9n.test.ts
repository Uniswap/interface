import { getTestSelector } from '../utils'

describe('translations', () => {
  // TODO re-enable web test
  it.skip('loads locale from the query param', () => {
    cy.visit('/?lng=fr-FR')
    cy.contains('Échanger')
    cy.contains('Uniswap disponible en : English')
  })

  // TODO re-enable web test
  it.skip('loads locale from menu', () => {
    cy.visit('/')
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get(getTestSelector('wallet-settings')).click()
    cy.get(getTestSelector('wallet-language-item')).contains('français').click({ force: true })
    cy.location('search').should('match', /\?lng=fr-FR$/)
    cy.contains('Échanger')
    cy.contains('Uniswap disponible en : English')
  })
})
