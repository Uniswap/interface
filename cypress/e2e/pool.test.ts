describe('Pool', () => {
  beforeEach(() => cy.visit('/pool'))

  it('add liquidity links to /add/ETH', () => {
    cy.get('#join-pool-button').click()
    cy.url().should('contain', '/add/ETH')
  })

  it('should return to /pool', () => {
    cy.visit('/pool/1')
    cy.get('[data-cy="visit-pool"]').click()
    cy.get('#join-pool-button').should('exist')
  })
})
