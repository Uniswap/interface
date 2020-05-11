describe('Pool', () => {
  beforeEach(() => cy.visit('/pool'))
  it('can search for a pool', () => {
    cy.get('#join-pool-button').click()
    cy.get('#token-search-input').type('DAI')
  })

  it.skip('can import a pool', () => {
    cy.get('#join-pool-button').click()
    cy.get('#import-pool-link').click() // blocked by the grid element in the search box
    cy.url().should('include', '/find')
  })
})
