describe('Warning', () => {
  beforeEach(() => {
    cy.visit('/swap?outputCurrency=0x0a40f26d74274b7f22b28556a27b35d97ce08e0a')
  })

  it('Check that warning is displayed', () => {
    cy.get('.token-warning-container').should('be.visible')
  })

  it('Check that warning hides after button dismissal', () => {
    cy.get('.token-dismiss-button').should('be.disabled')
    cy.get('.understand-checkbox').click()
    cy.get('.token-dismiss-button').should('not.be.disabled')
    cy.get('.token-dismiss-button').click()
    cy.get('.token-warning-container').should('not.be.visible')
  })
})
