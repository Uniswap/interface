import { TEST_ADDRESS_NEVER_USE_SHORTENED } from '../support/ethereum'
import { getTestSelector, selectFeatureFlag } from '../utils'

describe('Wallet Dropdown', () => {
  before(() => {
    cy.visit('/')
    selectFeatureFlag('navBar')
  })

  it('should change the theme', () => {
    cy.get(getTestSelector('menu-wallet-dropdown')).click()
    cy.get(getTestSelector('menu-select-theme')).click()
    cy.get(getTestSelector('menu-select-theme')).contains('Light theme').should('exist')
  })

  it('should select a language', () => {
    cy.get(getTestSelector('menu-select-language')).click()
    cy.get(getTestSelector('menu-language-item')).contains('Afrikaans').click({ force: true })
    cy.get(getTestSelector('menu-header')).should('contain', 'Taal')
    cy.get(getTestSelector('menu-language-item')).contains('English').click({ force: true })
    cy.get(getTestSelector('menu-header')).should('contain', 'Language')
    cy.get(getTestSelector('menu-back')).click()
  })

  it('should open the wallet connect modal from the drop down', () => {
    cy.get(getTestSelector('menu-connect-wallet')).click()
    cy.get(getTestSelector('wallet-modal')).should('exist')
    cy.get(getTestSelector('wallet-modal-close')).click()
  })

  it('should open the wallet connect modal from the navbar', () => {
    cy.get(getTestSelector('navbar-connect-wallet')).click()
    cy.get(getTestSelector('wallet-modal')).should('exist')
  })
})
