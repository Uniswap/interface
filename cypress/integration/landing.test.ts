describe('Landing Page', () => {
  beforeEach(() => cy.visit('/'))
  it('loads swap page', () => {
    cy.get('#swap-page')
    cy.screenshot()
  })

  it('redirects to url /swap', () => {
    cy.url().should('include', '/swap')
  })

  it('allows navigation to pool', () => {
    cy.get('#pool-nav-link').click()
    cy.url().should('include', '/pool')
  })
})
