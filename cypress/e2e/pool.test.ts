describe('Pool', () => {
  beforeEach(() => {
    cy.visit('/pool').then(() => {
      window.localStorage.setItem('FiatOnrampAnnouncement-dismissed', 'true')
    })
  })

  it('add liquidity links to /add/ETH', () => {
    cy.get('#join-pool-button').click()
    cy.url().should('contain', '/add/ETH')
  })
})
