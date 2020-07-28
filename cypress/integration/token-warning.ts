describe('Warning', () => {
  beforeEach(() => cy.visit('/swap?outputCurrency=0x0a40f26d74274b7f22b28556a27b35d97ce08e0a'))
  it('Check that warning is displayed', () => {
    cy.get('.token-warning-container').should('be.visible')
  })
  it('Check that warning hides after button dismissal.', () => {
    cy.get('.token-dismiss-button').click({ force: true })
    cy.get('.token-warning-container').should('not.be.visible')
  })
  it('Check that supression persists across sessions.', () => {
    cy.get('.token-warning-container').should('not.be.visible')
  })
})
