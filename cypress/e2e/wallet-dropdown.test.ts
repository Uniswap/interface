import { TEST_ADDRESS_NEVER_USE_SHORTENED } from '../support/ethereum'
import { testSelector, selectFeatureFlag } from '../utils'

describe('Wallet', () => {
  before(() => {
    cy.visit('/')
  })

  it('Testing Basic Wallet Functionality', () => {
    selectFeatureFlag('navBar')
    cy.get(testSelector('wallet-dropdown')).click()

    cy.get(testSelector('select-language')).click()
    // cy.get('a > div').contains('Afrikaans').click()
    cy.get(testSelector('language-item')).contains('Afrikaans').click()

    // cy.get('a').contains('English').click();
    // get theme
    // cy.get(testSelector('select-theme')).click()
    // cy.get(testSelector('select-theme')).contains('Light theme').should('exist')

    // cy.get('[data-testid="menu-dropdown"] > button').contains('Language').click()
    // cy.get('[data-testid="language-item"]').contains('Afrikaans').click()
    // cy.get('[data-testid="back-section-title"]').should('exist')
    // cy.get('[data-testid="back-section-title"]').should('contain', 'Taal')
    // cy.get('[data-testid="language-item"]').contains('English').click()
    // cy.get('[data-testid="back-section-return"]').click()

    cy.wait(12000)

    // open wallet modal
    // cy.get(testSelector('wallet-connect')).click()
    // cy.get(testSelector('wallet-modal')).should('exist')
  })
})
