describe('Pool', () => {
  beforeEach(() => cy.visit('/pool'))
  it('can search for a pool', () => {
    cy.get('#join-pool-button').click()
    cy.get('#token-search-input').type('DAI', { delay: 200 })
  })

  it('can import a pool', () => {
    cy.get('#join-pool-button').click()
    cy.get('#import-pool-link').click({ force: true }) // blocked by the grid element in the search box
    cy.url().should('include', '/find')
  })
})
