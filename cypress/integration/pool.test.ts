describe('Pool', () => {
  beforeEach(() => cy.visit('/pool'))
  it('add liquidity links to /add/EVMOS', () => {
    cy.get('#join-pool-button').click()
    cy.url().should('contain', '/add/v2/EVMOS')
  })
})
