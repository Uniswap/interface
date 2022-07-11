describe('Release', () => {
  it('loads swap page', () => {
    cy.visit('/', {
      retryOnStatusCodeFailure: true,
      retryOnNetworkFailure: true,
    }).get('#swap-page')
  })
})
