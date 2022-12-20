describe('Pool', () => {
  beforeEach(() => cy.visit('/pool'))

  it.skip('add liquidity links to /add/ETH', () => {
    cy.get('#join-pool-button').click()
    cy.url().should('contain', '/add/ETH')
  })
})
