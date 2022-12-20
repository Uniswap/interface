describe('Pool', () => {
  beforeEach(() => cy.visit('/pool'))

  xit('add liquidity links to /add/ETH', () => {
    cy.get('#join-pool-button').click()
    cy.url().should('contain', '/add/ETH')
  })
})
