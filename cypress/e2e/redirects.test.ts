describe('Redirect', () => {
  it('should redirect to /vote/create-proposal when visiting /create-proposal', () => {
    cy.visit('/create-proposal')
    cy.url().should('match', /\/vote\/create-proposal/)
  })
  it('should redirect to /not-found when visiting nonexist url', () => {
    cy.visit('/none-exist-url')
    cy.url().should('match', /\/not-found/)
  })
})
