import { getTestSelector } from '../../utils'

describe('Swap settings', () => {
  it('Opens and closes the settings menu', () => {
    cy.visit('/swap')
    cy.contains('Settings').should('not.exist')
    cy.get(getTestSelector('open-settings-dialog-button')).click()
    cy.get(getTestSelector('mobile-settings-menu')).should('not.exist')
    cy.contains('Max. slippage').should('exist')
    cy.contains('Transaction deadline').should('exist')
    cy.contains('UniswapX').should('exist')
    cy.get(getTestSelector('open-settings-dialog-button')).click()
    cy.contains('Settings').should('not.exist')
  })

  it('should open the mobile settings menu', () => {
    // Set viewport to iPhone 6
    cy.viewport('iphone-6')
    cy.visit('/swap')

    // Click the button to open the settings dialog
    cy.get(getTestSelector('open-settings-dialog-button')).click({ waitForAnimations: true })

    // Verify the mobile settings menu and its contents
    cy.get(getTestSelector('mobile-settings-menu'))
      .should('exist')
      .within(() => {
        cy.contains('Max. slippage').should('exist')
        cy.contains('UniswapX').should('exist')
        cy.contains('Transaction deadline').should('exist')
        cy.get(getTestSelector('mobile-settings-close')).click()
      })
  })
})
