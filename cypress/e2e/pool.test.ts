describe('Pool', () => {
  beforeEach(() => {
    cy.visit('/pools').then(() => {
      cy.wait('@eth_blockNumber')
    })
  })

  it('add liquidity links to /add/ETH', () => {
    cy.get('body').then(() => {
      cy.get('#join-pool-button')
        .click()
        .then(() => {
          cy.url().should('contain', '/add/ETH')
        })
    })
  })
})
