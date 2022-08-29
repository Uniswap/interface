import { TEST_ADDRESS_NEVER_USE_SHORTENED } from '../support/ethereum'
import { testSelector, selectFeatureFlag } from '../utils'

describe('Wallet Dropdown', () => {
  before(() => {
    cy.visit('/')
    selectFeatureFlag('navBar')
  })

  it('should change the theme', () => {
    cy.get(testSelector('menu-wallet-dropdown')).click()
    cy.get(testSelector('menu-select-theme')).click()
    cy.get(testSelector('menu-select-theme')).contains('Light theme').should('exist')
  })

  it('should select a language', () => {
    cy.get(testSelector('menu-select-language')).click()
    cy.get(testSelector('menu-language-item')).contains('Afrikaans').click({ force: true })
    cy.get(testSelector('menu-header')).should('contain', 'Taal')
    cy.get(testSelector('menu-language-item')).contains('English').click({ force: true })
    cy.get(testSelector('menu-header')).should('contain', 'Language')
    cy.get(testSelector('menu-back')).click()
  })

  it('should open the wallet connect modal from the drop down', () => {
    cy.get(testSelector('menu-connect-wallet')).click()
    cy.get(testSelector('wallet-modal')).should('exist')
    cy.get(testSelector('wallet-modal-close')).click()
  })

  it('should open the wallet connect modal from the navbar', () => {
    cy.get(testSelector('navbar-connect-wallet')).click()
    cy.get(testSelector('wallet-modal')).should('exist')
  })
})
