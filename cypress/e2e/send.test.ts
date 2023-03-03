describe('Send', () => {
  it('should redirect', () => {
    cy.visit('/send')
    cy.url().should('include', '/swap')
  })

  it('should redirect with url params', () => {
    cy.visit('/send', { qs: { outputCurrency: 'ETH', recipient: 'bob.argent.xyz' } })
    cy.url().should('contain', 'outputCurrency=ETH')
    cy.url().should('contain', 'recipient=bob.argent.xyz')
  })
})
