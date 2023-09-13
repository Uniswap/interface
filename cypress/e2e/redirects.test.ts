describe('Redirect', () => {
  it('should redirect to /vote/create-proposal when visiting /create-proposal', () => {
    cy.visit('/create-proposal')
    cy.url().should('match', /\/vote\/create-proposal/)
  })
  it('should redirect to /not-found when visiting nonexist url', () => {
    cy.visit('/none-exist-url')
    cy.url().should('match', /\/not-found/)
  })
  it('should redirect to error pages if removing-liquidity pool does not exist', () => {
    // Duplicate-token v2 pools redirect to position unavailable
    cy.visit(`/remove/v2/ETH/ETH`)
    cy.contains('Position unavailable')

    // Single-token pools don't exist
    cy.visit('/remove/v2/ETH')
    cy.url().should('match', /\/not-found/)

    // Nonexist v3 tokenId pool
    cy.visit('/remove/-1')
    cy.contains('Position unavailable')
  })
})
