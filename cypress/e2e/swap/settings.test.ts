import { getTestSelector } from '../../utils'

describe('Swap settings', () => {
  it('Opens and closes the settings menu', () => {
    cy.visit('/swap')
    cy.contains('Settings').should('not.exist')
    cy.get(getTestSelector('open-settings-dialog-button')).click()
    cy.contains('Max slippage').should('exist')
    cy.contains('Transaction deadline').should('exist')
    cy.contains('Auto Router API').should('exist')
    cy.get(getTestSelector('open-settings-dialog-button')).click()
    cy.contains('Settings').should('not.exist')
  })
})
