import { getTestSelector } from '../utils'

describe('Wallet Dropdown', () => {
  before(() => {
    cy.visit('/')
  })

  it('should change the theme', () => {
    // TODO(cartcrom): Remove banner code once it's gone
    cy.get(getTestSelector('nft-banner')).click()
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get(getTestSelector('wallet-select-theme')).click()
    cy.get(getTestSelector('wallet-select-theme')).contains('Light theme').should('exist')
  })

  it('should select a language', () => {
    cy.get(getTestSelector('wallet-select-language')).click()
    cy.get(getTestSelector('wallet-language-item')).contains('Afrikaans').click({ force: true })
    cy.get(getTestSelector('wallet-header')).should('contain', 'Taal')
    cy.get(getTestSelector('wallet-language-item')).contains('English').click({ force: true })
    cy.get(getTestSelector('wallet-header')).should('contain', 'Language')
    cy.get(getTestSelector('wallet-back')).click()
  })

  it('should be able to view transactions', () => {
    cy.get(getTestSelector('wallet-transactions')).click()
    cy.get(getTestSelector('wallet-empty-transaction-text')).should('exist')
    cy.get(getTestSelector('wallet-back')).click()
  })

  it('should change the theme when not connected', () => {
    cy.get(getTestSelector('wallet-disconnect')).click()
    cy.get(getTestSelector('wallet-select-theme')).click()
    cy.get(getTestSelector('wallet-select-theme')).contains('Dark theme').should('exist')
  })

  it('should select a language when not connected', () => {
    cy.get(getTestSelector('wallet-select-language')).click()
    cy.get(getTestSelector('wallet-language-item')).contains('Afrikaans').click({ force: true })
    cy.get(getTestSelector('wallet-header')).should('contain', 'Taal')
    cy.get(getTestSelector('wallet-language-item')).contains('English').click({ force: true })
    cy.get(getTestSelector('wallet-header')).should('contain', 'Language')
    cy.get(getTestSelector('wallet-back')).click()
  })
})
