describe('Send', () => {
  beforeEach(() => cy.visit('/send'))

  it('should redirect', () => {
    cy.url().should('include', '/swap')
  })
})
